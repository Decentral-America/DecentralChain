import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getSql } from '@/lib/db';
import { logger } from '@/lib/logger';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

// ── Public types (shared with UI) ─────────────────────────────────────────────

export interface LoadTestRun {
  id: string;
  startedAt: string;
  completedAt: string;
  user: string;
  config: {
    targetNode: string;
    workers: number;
    targetTps: number;
    duration: number;
    chainId: string;
    senderCount: number;
  };
  result: {
    avgTps: number;
    totalSent: number;
    totalConfirmed: number;
    totalErrors: number;
    p50Ms?: number;
    p95Ms?: number;
    p99Ms?: number;
  };
  gitSha?: string;
}

// ── DB row → public type ──────────────────────────────────────────────────────

interface DbRow {
  id: string;
  started_at: Date;
  completed_at: Date;
  run_by: string;
  target_node: string;
  workers: number;
  target_tps: number;
  duration_s: number;
  chain_id: string;
  sender_count: number;
  avg_tps: string;
  total_sent: string;
  total_confirmed: string;
  total_errors: string;
  p50_ms: string | null;
  p95_ms: string | null;
  p99_ms: string | null;
  git_sha: string | null;
}

function toPublic(row: DbRow): LoadTestRun {
  return {
    completedAt: row.completed_at.toISOString(),
    config: {
      chainId: row.chain_id,
      duration: row.duration_s,
      senderCount: row.sender_count,
      targetNode: row.target_node,
      targetTps: row.target_tps,
      workers: row.workers,
    },
    gitSha: row.git_sha ?? undefined,
    id: row.id,
    result: {
      avgTps: Number(row.avg_tps),
      p50Ms: row.p50_ms != null ? Number(row.p50_ms) : undefined,
      p95Ms: row.p95_ms != null ? Number(row.p95_ms) : undefined,
      p99Ms: row.p99_ms != null ? Number(row.p99_ms) : undefined,
      totalConfirmed: Number(row.total_confirmed),
      totalErrors: Number(row.total_errors),
      totalSent: Number(row.total_sent),
    },
    startedAt: row.started_at.toISOString(),
    user: row.run_by,
  };
}

// ── Routes ────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  try {
    const sql = getSql();
    const rows = await sql<DbRow[]>`
      SELECT *
      FROM   load_test_runs
      ORDER  BY started_at DESC
      LIMIT  50
    `;
    return Response.json({ runs: rows.map(toPublic) });
  } catch (err) {
    logger.error({ err }, 'load-test history: DB read failed');
    return Response.json({ error: 'Database unavailable' }, { status: 503 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const intent = body.intent;

  if (intent === 'save') {
    const run = body.run as LoadTestRun | undefined;
    if (!run || typeof run !== 'object') {
      return Response.json({ error: 'run is required' }, { status: 400 });
    }

    try {
      const sql = getSql();
      await sql`
        INSERT INTO load_test_runs (
          id, started_at, completed_at, run_by,
          target_node, workers, target_tps, duration_s, chain_id, sender_count,
          avg_tps, total_sent, total_confirmed, total_errors,
          p50_ms, p95_ms, p99_ms, git_sha
        ) VALUES (
          ${run.id},
          ${new Date(run.startedAt)},
          ${new Date(run.completedAt)},
          ${user},
          ${run.config.targetNode},
          ${run.config.workers},
          ${run.config.targetTps},
          ${run.config.duration},
          ${run.config.chainId},
          ${run.config.senderCount},
          ${run.result.avgTps},
          ${run.result.totalSent},
          ${run.result.totalConfirmed},
          ${run.result.totalErrors},
          ${run.result.p50Ms ?? null},
          ${run.result.p95Ms ?? null},
          ${run.result.p99Ms ?? null},
          ${run.gitSha ?? null}
        )
        ON CONFLICT (id) DO NOTHING
      `;
      logger.info({ runId: run.id, user }, 'Load test run saved');
      return Response.json({ ok: true });
    } catch (err) {
      logger.error({ err, runId: run.id }, 'load-test history: DB save failed');
      return Response.json({ error: 'Database unavailable' }, { status: 503 });
    }
  }

  if (intent === 'delete') {
    const id = body.id;
    if (typeof id !== 'string') {
      return Response.json({ error: 'id is required' }, { status: 400 });
    }
    try {
      const sql = getSql();
      await sql`DELETE FROM load_test_runs WHERE id = ${id}`;
      logger.info({ id, user }, 'Load test run deleted');
      return Response.json({ ok: true });
    } catch (err) {
      logger.error({ err, id }, 'load-test history: DB delete failed');
      return Response.json({ error: 'Database unavailable' }, { status: 503 });
    }
  }

  return new Response('Unknown intent', { status: 400 });
}
