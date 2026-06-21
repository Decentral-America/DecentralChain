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

// Single-process assumption: react-router-serve runs one Node.js process.
// If you add cluster workers, move this state to Redis or a named pipe.
const runs = new Map<string, ChildProcess>();

interface StartParams {
  targetNode: string;
  workers: number;
  targetTps: number;
  duration: number;
  seedPhrase: string;
  chainId: string;
  senderCount: number;
}

function validateStartParams(
  body: Record<string, unknown>,
): { ok: true; params: StartParams } | { ok: false; error: string } {
  const { targetNode, workers, targetTps, duration, seedPhrase, chainId, senderCount } = body;

  if (typeof targetNode !== 'string' || !/^https?:\/\/.+/.test(targetNode)) {
    return { error: 'targetNode must be a valid HTTP(S) URL', ok: false };
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
  if (typeof seedPhrase !== 'string' || seedPhrase.trim().split(/\s+/).length < 12) {
    return { error: 'seedPhrase must be at least 12 words', ok: false };
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
      seedPhrase: seedPhrase.trim(),
      senderCount: senderCountNum,
      targetNode,
      targetTps: tpsNum,
      workers: workersNum,
    },
  };
}

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const runId = url.searchParams.get('runId');

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
        try {
          controller.close();
        } catch {
          /* already closed */
        }
        runs.delete(runId);
        logger.info({ runId, user }, 'Load test stream closed');
      };

      const onData = (chunk: Buffer) => {
        for (const line of chunk.toString().split('\n')) {
          const trimmed = line.trim();
          if (trimmed) {
            controller.enqueue(enc.encode(`data: ${trimmed}\n\n`));
          }
        }
      };

      child.stdout?.on('data', onData);
      child.once('close', cleanup);
      child.once('error', (err) => {
        logger.error({ err, runId }, 'Load test process error');
        cleanup();
      });

      // Kill child and close stream when client disconnects.
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
      // Prevent Nginx/Caddy from buffering the event stream.
      'X-Accel-Buffering': 'no',
    },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const intent = body.intent;

  if (intent === 'start') {
    const validation = validateStartParams(body);
    if (!validation.ok) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const { targetNode, workers, targetTps, duration, seedPhrase, chainId, senderCount } =
      validation.params;
    const runId = crypto.randomUUID();

    const child = spawn(
      process.env.DCC_LOAD_TESTER_PATH ?? '/opt/dcc/load-tester',
      [
        '--json',
        '--node',
        targetNode,
        '--workers',
        String(workers),
        '--target-tps',
        String(targetTps),
        '--duration',
        String(duration),
        '--chain-id',
        chainId,
        '--sender-count',
        String(senderCount),
        // seed is passed via DCC_PRIVATE_KEY env var, not --seed, to keep it
        // out of the process argument list (visible in ps aux).
      ],
      {
        env: { ...process.env, DCC_PRIVATE_KEY: seedPhrase },
        stdio: ['ignore', 'pipe', 'pipe'],
      },
    );

    child.stderr?.on('data', (chunk: Buffer) => {
      logger.warn({ output: chunk.toString().trim(), runId }, 'Load tester stderr');
    });

    runs.set(runId, child);
    logger.info(
      { duration, runId, senderCount, targetNode, targetTps, user, workers },
      'Load test started',
    );
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
      logger.info({ runId, user }, 'Load test stopped by user');
    }
    return Response.json({ ok: true });
  }

  return new Response('Unknown intent', { status: 400 });
}
