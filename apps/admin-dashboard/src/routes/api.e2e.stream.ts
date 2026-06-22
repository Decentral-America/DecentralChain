import { type ChildProcess, spawn } from 'node:child_process';
import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

export type E2ESuite = 'smoke' | 'full';

// Smoke suite: fast subset of specs that cover the three main categories.
const SMOKE_SPECS = [
  'src/transactions/transfer.spec.ts',
  'src/transactions/invoke-script.spec.ts',
  'src/network/node-api.spec.ts',
];

// Single-process assumption — same pattern as the load-tester.
const runs = new Map<string, ChildProcess>();

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const runId = new URL(request.url).searchParams.get('runId');
  if (!runId) return new Response('Missing runId', { status: 400 });

  const child = runs.get(runId);
  if (!child) return new Response('Run not found or already completed', { status: 404 });

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      let cleaned = false;

      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        child.stdout?.off('data', onData);
        child.stderr?.off('data', onStderr);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
        runs.delete(runId);
        logger.info({ runId, user }, 'E2E stream closed');
      };

      const onData = (chunk: Buffer) => {
        for (const line of chunk.toString().split('\n')) {
          const t = line.trimEnd();
          if (t) {
            // Encode as plain SSE text lines — the client renders them verbatim.
            controller.enqueue(enc.encode(`data: ${JSON.stringify({ line: t })}\n\n`));
          }
        }
      };

      const onStderr = (chunk: Buffer) => {
        for (const line of chunk.toString().split('\n')) {
          const t = line.trimEnd();
          if (t) {
            controller.enqueue(
              enc.encode(`data: ${JSON.stringify({ line: t, stderr: true })}\n\n`),
            );
          }
        }
      };

      child.stdout?.on('data', onData);
      child.stderr?.on('data', onStderr);
      child.once('close', (code) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ code, event: 'exit' })}\n\n`));
        cleanup();
      });
      child.once('error', (err) => {
        logger.error({ err, runId }, 'E2E process error');
        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({ code: -1, error: err.message, event: 'exit' })}\n\n`,
          ),
        );
        cleanup();
      });

      request.signal.addEventListener('abort', () => {
        child.kill('SIGTERM');
        cleanup();
      });
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

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const intent = body.intent;

  if (intent === 'start') {
    const suite: E2ESuite = body.suite === 'smoke' ? 'smoke' : 'full';
    const runId = crypto.randomUUID();

    const suitePath = process.env.E2E_SUITE_PATH ?? '/opt/dcc/DecentralChain';

    const args = [
      '--filter',
      '@decentralchain/e2e-blockchain',
      'exec',
      'vitest',
      'run',
      '--reporter=verbose',
      ...(suite === 'smoke' ? SMOKE_SPECS : []),
    ];

    const child = spawn('pnpm', args, {
      cwd: suitePath,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    runs.set(runId, child);
    logger.info({ runId, suite, suitePath, user }, 'E2E run started');

    return Response.json({ runId });
  }

  if (intent === 'stop') {
    const runId = body.runId;
    if (typeof runId !== 'string') {
      return Response.json({ error: 'runId must be a string' }, { status: 400 });
    }
    const child = runs.get(runId);
    if (child) {
      child.kill('SIGTERM');
      runs.delete(runId);
      logger.info({ runId, user }, 'E2E run stopped by user');
    }
    return Response.json({ ok: true });
  }

  return new Response('Unknown intent', { status: 400 });
}
