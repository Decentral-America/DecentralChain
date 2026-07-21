import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { getSql } from '@/lib/db';
import {
  cancelRun,
  type DispatchTarget,
  dispatchWorkflow,
  downloadArtifactFile,
  pollRunStatus,
  type RunConclusion,
  type RunStatus,
  resolveDispatchedRun,
} from '@/lib/github-actions-runner';
import { logger } from '@/lib/logger';
import { isAllowedTargetNode } from '@/lib/target-nodes';

// ── Why this doesn't spawn a local binary or take a seed from the browser ──
//
// The load tester runs in an isolated GitHub Actions runner (infra's
// stress-test.yml), not in this container — this route is a thin control
// plane: dispatch the workflow, poll its status, fetch the structured
// results once it finishes. The funded sender seed lives only as a GitHub
// Actions secret (GEN_0_SEED_PHRASE) and is never sent from the browser or
// held in this process — a real improvement over the previous design, which
// required pasting a seed phrase into this page just to start a run.
//
// GitHub's API does not expose live logs/metrics for an in-progress run, so
// the per-second TPS chart can no longer update live during the run — it
// renders in full, from the load-tester's own JSONL tick events, once the
// run completes. See api.e2e.stream.ts for the parallel design.

const TARGET: DispatchTarget = {
  owner: 'Decentral-America',
  ref: 'main',
  repo: 'infra',
  workflowFile: 'stress-test.yml',
};

const POLL_INTERVAL_MS = 4_000;

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

interface StartParams {
  targetNode: string;
  workers: number;
  targetTps: number;
  duration: number;
  chainId: string;
  senderCount: number;
}

function validateStartParams(
  body: Record<string, unknown>,
): { ok: true; params: StartParams } | { ok: false; error: string } {
  const { targetNode, workers, targetTps, duration, chainId, senderCount } = body;

  if (typeof targetNode !== 'string' || !isAllowedTargetNode(targetNode)) {
    return { error: 'targetNode must be one of the allowlisted testnet nodes', ok: false };
  }
  const workersNum = Number(workers);
  if (!Number.isInteger(workersNum) || workersNum < 1 || workersNum > 2000) {
    return { error: 'workers must be an integer between 1 and 2000', ok: false };
  }
  const tpsNum = Number(targetTps);
  if (!Number.isInteger(tpsNum) || tpsNum < 1 || tpsNum > 10_000) {
    return { error: 'targetTps must be an integer between 1 and 10000', ok: false };
  }
  const durationNum = Number(duration);
  if (!Number.isInteger(durationNum) || durationNum < 1 || durationNum > 3600) {
    return { error: 'duration must be an integer between 1 and 3600', ok: false };
  }
  if (typeof chainId !== 'string' || chainId.length !== 1) {
    return { error: 'chainId must be exactly one character', ok: false };
  }
  const senderCountNum = senderCount === undefined ? 1 : Number(senderCount);
  if (!Number.isInteger(senderCountNum) || senderCountNum < 1 || senderCountNum > 100) {
    return { error: 'senderCount must be an integer between 1 and 100', ok: false };
  }

  return {
    ok: true,
    params: {
      chainId,
      duration: durationNum,
      senderCount: senderCountNum,
      targetNode,
      targetTps: tpsNum,
      workers: workersNum,
    },
  };
}

interface LoadTestTick {
  event: 'tick' | 'phase_end' | 'final';
  t?: number;
  tps?: number;
  sent?: number;
  confirmed?: number;
  errors?: number;
  avg_tps?: number;
  total_sent?: number;
  total_confirmed?: number;
  p50_ms?: number;
  p95_ms?: number;
  p99_ms?: number;
}

interface RunEntry {
  ghRunId: number | null;
  status: RunStatus | 'resolving';
  conclusion: RunConclusion;
  etag: string | null;
  htmlUrl: string | null;
  user: string;
  params: StartParams;
  startedAt: Date;
}

// Single-process assumption — same as every other stream route in this app.
const runs = new Map<string, RunEntry>();

function parseJsonl(bytes: Uint8Array): LoadTestTick[] {
  const text = new TextDecoder().decode(bytes);
  const events: LoadTestTick[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed) as LoadTestTick);
    } catch {
      /* not a JSON line (e.g. a stray log line) — ignore */
    }
  }
  return events;
}

async function persistCompletedRun(
  runId: string,
  entry: RunEntry,
  finalEvent: LoadTestTick | undefined,
) {
  try {
    const sql = getSql();
    const { params } = entry;
    await sql`
      INSERT INTO load_test_runs (
        id, started_at, completed_at, run_by,
        target_node, workers, target_tps, duration_s, chain_id, sender_count,
        avg_tps, total_sent, total_confirmed, total_errors,
        p50_ms, p95_ms, p99_ms
      ) VALUES (
        ${runId}, ${entry.startedAt}, ${new Date()}, ${entry.user},
        ${params.targetNode}, ${params.workers}, ${params.targetTps}, ${params.duration},
        ${params.chainId}, ${params.senderCount},
        ${Number(finalEvent?.avg_tps ?? 0)}, ${Number(finalEvent?.total_sent ?? 0)},
        ${Number(finalEvent?.total_confirmed ?? 0)}, ${Number(finalEvent?.errors ?? 0)},
        ${finalEvent?.p50_ms != null ? Number(finalEvent.p50_ms) : null},
        ${finalEvent?.p95_ms != null ? Number(finalEvent.p95_ms) : null},
        ${finalEvent?.p99_ms != null ? Number(finalEvent.p99_ms) : null}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (err) {
    logger.error({ err, runId }, 'Failed to persist load test run to DB');
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const runId = new URL(request.url).searchParams.get('runId');
  if (!runId) return new Response('Missing runId', { status: 400 });

  const entry = runs.get(runId);
  if (!entry) return new Response('Run not found or already completed', { status: 404 });

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      let closed = false;
      let timer: ReturnType<typeof setTimeout> | null = null;

      const send = (event: string, data: unknown) => {
        if (closed) return;
        controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      const finish = () => {
        if (closed) return;
        closed = true;
        if (timer) clearTimeout(timer);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const tick = async () => {
        if (closed) return;
        try {
          if (entry.ghRunId === null) {
            const resolved = await resolveDispatchedRun(TARGET, runId);
            entry.ghRunId = resolved.runId;
            entry.status = resolved.status;
            entry.conclusion = resolved.conclusion;
            entry.etag = resolved.etag;
            entry.htmlUrl = resolved.htmlUrl;
            send('status', {
              conclusion: entry.conclusion,
              htmlUrl: entry.htmlUrl,
              status: entry.status,
            });
          } else {
            const polled = await pollRunStatus(TARGET, entry.ghRunId, entry.etag);
            if (polled !== 'unchanged') {
              entry.status = polled.status;
              entry.conclusion = polled.conclusion;
              entry.etag = polled.etag;
              send('status', {
                conclusion: entry.conclusion,
                htmlUrl: entry.htmlUrl,
                status: entry.status,
              });
            }
          }

          if (entry.status === 'completed' && entry.ghRunId !== null) {
            let events: LoadTestTick[] = [];
            try {
              const bytes = await downloadArtifactFile(
                TARGET,
                entry.ghRunId,
                `load-test-results-${runId}`,
                'load-test-output.jsonl',
              );
              if (bytes) events = parseJsonl(bytes);
            } catch (err) {
              logger.error({ err, runId }, 'Failed to fetch/parse load test results artifact');
            }

            const finalEvent = events.find((e) => e.event === 'final');
            const ticks = events.filter((e) => e.event === 'tick');
            send('result', { finalEvent, ticks });
            await persistCompletedRun(runId, entry, finalEvent);
            send('exit', { conclusion: entry.conclusion });
            runs.delete(runId);
            finish();
            return;
          }
        } catch (err) {
          logger.error({ err, runId }, 'Load test status poll failed');
          send('exit', {
            conclusion: 'failure',
            error: err instanceof Error ? err.message : String(err),
          });
          runs.delete(runId);
          finish();
          return;
        }

        timer = setTimeout(() => void tick(), POLL_INTERVAL_MS);
      };

      void tick();

      // Closing the tab does NOT cancel the underlying CI run — that's the
      // whole point of moving execution off this box. Only Stop does.
      request.signal.addEventListener('abort', finish);
    },
  });

  return new Response(stream, {
    headers: {
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    },
  });
}

function hasActiveRun(): boolean {
  for (const entry of runs.values()) {
    if (entry.status !== 'completed') return true;
  }
  return false;
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const intent = body.intent;

  if (intent === 'start') {
    if (hasActiveRun()) {
      return Response.json(
        { error: 'A stress test is already in progress. Wait for it to finish, or stop it first.' },
        { status: 409 },
      );
    }

    const validation = validateStartParams(body);
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }
    const { params } = validation;

    const runId = crypto.randomUUID();
    // Reserve the slot synchronously before any await, so a rapid double-click
    // can't race past the hasActiveRun() check above.
    runs.set(runId, {
      conclusion: null,
      etag: null,
      ghRunId: null,
      htmlUrl: null,
      params,
      startedAt: new Date(),
      status: 'resolving',
      user,
    });

    try {
      await dispatchWorkflow(TARGET, runId, {
        chain_id: params.chainId,
        duration: String(params.duration),
        sender_count: String(params.senderCount),
        target_node: params.targetNode,
        target_tps: String(params.targetTps),
        workers: String(params.workers),
      });
    } catch (err) {
      runs.delete(runId);
      logger.error({ err, runId }, 'Failed to dispatch stress test workflow');
      return Response.json(
        { error: err instanceof Error ? err.message : 'Failed to dispatch stress test workflow' },
        { status: 502 },
      );
    }

    logger.info({ params, runId, user }, 'Stress test dispatched');
    return Response.json({ runId });
  }

  if (intent === 'stop') {
    const runId = body.runId;
    if (typeof runId !== 'string') {
      return Response.json({ error: 'runId must be a string' }, { status: 400 });
    }
    const entry = runs.get(runId);
    if (entry?.ghRunId !== null && entry?.ghRunId !== undefined) {
      await cancelRun(TARGET, entry.ghRunId);
    }
    runs.delete(runId);
    logger.info({ runId, user }, 'Stress test cancelled by user');
    return Response.json({ ok: true });
  }

  return new Response('Unknown intent', { status: 400 });
}
