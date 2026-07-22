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

// ── Why this doesn't spawn anything locally ─────────────────────────────────
//
// E2E execution happens in an isolated GitHub Actions runner (infra's
// admin-e2e.yml), not in this container — this route is a thin control plane:
// dispatch the workflow, poll its status, fetch the structured results once
// it finishes. The funded test seed and rate-limit bypass key live only as
// GitHub Actions secrets and never pass through this process. See
// api.load-test.stream.ts for the parallel design (dispatched load-tester).

const TARGET: DispatchTarget = {
  owner: 'Decentral-America',
  ref: 'main',
  repo: 'infra',
  workflowFile: 'admin-e2e.yml',
};

const POLL_INTERVAL_MS = 4_000;

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

export type E2ESuite = 'smoke' | 'full' | 'custom';

export const SMOKE_SPECS = [
  'src/transactions/transfer.spec.ts',
  'src/transactions/invoke-script.spec.ts',
  'src/network/node-api.spec.ts',
];

export const ALL_SPECS = {
  e2e: ['src/e2e/defi-flow.spec.ts', 'src/e2e/token-launch.spec.ts'],
  network: [
    'src/network/data-service.spec.ts',
    'src/network/finality.spec.ts',
    'src/network/node-api.spec.ts',
    'src/network/peers.spec.ts',
    'src/network/rest-coverage.spec.ts',
    'src/network/rest-coverage-2.spec.ts',
  ],
  performance: ['src/performance/throughput.spec.ts'],
  transactions: [
    'src/transactions/account-scripts.spec.ts',
    'src/transactions/advanced-types.spec.ts',
    'src/transactions/alias.spec.ts',
    'src/transactions/asset-lifecycle.spec.ts',
    'src/transactions/burn-reissue.spec.ts',
    'src/transactions/dapp.spec.ts',
    'src/transactions/data.spec.ts',
    'src/transactions/ethereum.spec.ts',
    'src/transactions/exchange.spec.ts',
    'src/transactions/invoke-script.spec.ts',
    'src/transactions/issue-edge.spec.ts',
    'src/transactions/issue.spec.ts',
    'src/transactions/leasing.spec.ts',
    'src/transactions/mass-transfer.spec.ts',
    'src/transactions/pipeline.spec.ts',
    'src/transactions/ride-collections-stdlib.spec.ts',
    'src/transactions/ride-crypto-stdlib.spec.ts',
    'src/transactions/set-script.spec.ts',
    'src/transactions/smart-assets.spec.ts',
    'src/transactions/sponsorship.spec.ts',
    'src/transactions/transfer.spec.ts',
    'src/transactions/update-asset-info.spec.ts',
  ],
} as const;

interface VitestJsonAssertionResult {
  title: string;
  fullName: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration?: number;
  failureMessages?: string[];
}
interface VitestJsonTestResult {
  name: string;
  status: 'passed' | 'failed';
  assertionResults: VitestJsonAssertionResult[];
}
interface VitestJsonReport {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  testResults: VitestJsonTestResult[];
}

interface RunEntry {
  ghRunId: number | null;
  status: RunStatus | 'resolving';
  conclusion: RunConclusion;
  etag: string | null;
  htmlUrl: string | null;
  user: string;
  suite: E2ESuite;
  startedAt: Date;
}

// Single-process assumption — same as every other stream route in this app.
const runs = new Map<string, RunEntry>();

async function persistCompletedRun(
  runId: string,
  entry: RunEntry,
  report: VitestJsonReport | null,
) {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO e2e_runs (
        id, started_at, completed_at, run_by, suite, conclusion,
        total_tests, passed_tests, failed_tests, gh_run_url
      ) VALUES (
        ${runId}, ${entry.startedAt}, ${new Date()}, ${entry.user}, ${entry.suite},
        ${entry.conclusion}, ${report?.numTotalTests ?? null}, ${report?.numPassedTests ?? null},
        ${report?.numFailedTests ?? null}, ${entry.htmlUrl}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  } catch (err) {
    logger.error({ err, runId }, 'Failed to persist e2e run to DB');
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
            let report: VitestJsonReport | null = null;
            try {
              const bytes = await downloadArtifactFile(
                TARGET,
                entry.ghRunId,
                `e2e-results-${runId}`,
                'e2e-results.json',
              );
              if (bytes) report = JSON.parse(new TextDecoder().decode(bytes)) as VitestJsonReport;
            } catch (err) {
              logger.error({ err, runId }, 'Failed to fetch/parse e2e results artifact');
            }

            send('result', { report });
            await persistCompletedRun(runId, entry, report);
            send('exit', { conclusion: entry.conclusion });
            runs.delete(runId);
            finish();
            return;
          }
        } catch (err) {
          logger.error({ err, runId }, 'E2E status poll failed');
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

      // The dashboard tab closing does NOT cancel the underlying CI run — it
      // keeps running regardless (that's the point of moving execution off
      // this box). It only stops relaying updates to this particular client.
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
        { error: 'An E2E run is already in progress. Wait for it to finish, or stop it first.' },
        { status: 409 },
      );
    }

    const customSpecs = Array.isArray(body.specs) ? (body.specs as string[]) : null;
    const suite: E2ESuite =
      body.suite === 'smoke' ? 'smoke' : body.suite === 'custom' ? 'custom' : 'full';
    const specsToRun = customSpecs ?? (suite === 'smoke' ? SMOKE_SPECS : []);

    const runId = crypto.randomUUID();
    // Reserve the slot synchronously before any await, so a rapid double-click
    // can't race past the hasActiveRun() check above.
    runs.set(runId, {
      conclusion: null,
      etag: null,
      ghRunId: null,
      htmlUrl: null,
      startedAt: new Date(),
      status: 'resolving',
      suite,
      user,
    });

    try {
      await dispatchWorkflow(TARGET, runId, {
        specs: specsToRun.join(' '),
        suite,
      });
    } catch (err) {
      runs.delete(runId);
      logger.error({ err, runId }, 'Failed to dispatch E2E workflow');
      return Response.json(
        { error: err instanceof Error ? err.message : 'Failed to dispatch E2E workflow' },
        { status: 502 },
      );
    }

    logger.info({ runId, suite, user }, 'E2E run dispatched');
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
    logger.info({ runId, user }, 'E2E run cancelled by user');
    return Response.json({ ok: true });
  }

  return new Response('Unknown intent', { status: 400 });
}
