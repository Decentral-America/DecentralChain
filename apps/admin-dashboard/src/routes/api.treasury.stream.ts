import { EventEmitter } from 'node:events';
import { broadcast, transfer } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  isFunded,
  readWalletCsv,
  scanBalances,
  sweepAmount,
  TRANSFER_FEE,
  type WalletBalance,
  type WalletEntry,
} from '@/lib/wallets';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

// ── SSE event types ──────────────────────────────────────────────────────────

export interface SweepProgressEvent {
  event: 'progress';
  processed: number;
  total: number;
  recovered_wavelets: number;
  errors: number;
  status: 'running';
}

export interface SweepDoneEvent {
  event: 'done';
  processed: number;
  total: number;
  recovered_wavelets: number;
  errors: number;
  status: 'done';
}

export interface SweepErrorEvent {
  event: 'error';
  message: string;
}

// ── In-process job registry ──────────────────────────────────────────────────

// Single-process assumption: react-router-serve runs one Node.js process.
// If cluster workers are added, move this state to Redis pub/sub.
const sweepJobs = new Map<string, EventEmitter>();

// ── Sweep execution ──────────────────────────────────────────────────────────

async function runSweep(
  sweepId: string,
  emitter: EventEmitter,
  nodeUrl: string,
  chainId: string,
  senderAddress: string,
  user: string,
): Promise<void> {
  const csvPath = process.env.DCC_WALLET_CSV_PATH ?? '/opt/dcc/test-wallets.csv';

  let wallets: WalletEntry[];
  try {
    wallets = readWalletCsv(csvPath);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read wallet CSV';
    logger.error({ err, sweepId, user }, 'Sweep: failed to read wallet CSV');
    emitter.emit('error', { event: 'error', message } satisfies SweepErrorEvent);
    return;
  }

  logger.info({ csvPath, sweepId, user, wallets: wallets.length }, 'Sweep: scanning balances');

  let balances: WalletBalance[];
  try {
    balances = await scanBalances(wallets, nodeUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Balance scan failed';
    logger.error({ err, sweepId, user }, 'Sweep: balance scan failed');
    emitter.emit('error', { event: 'error', message } satisfies SweepErrorEvent);
    return;
  }

  const funded = balances.filter(isFunded);
  const total = funded.length;

  logger.info({ funded: total, sweepId, user }, 'Sweep: starting');

  let processed = 0;
  let recovered_wavelets = 0;
  let errors = 0;

  for (const wallet of funded) {
    const amount = sweepAmount(wallet);
    if (amount <= 0) {
      errors++;
      processed++;
      continue;
    }

    try {
      const tx = transfer(
        {
          amount,
          chainId,
          fee: TRANSFER_FEE,
          recipient: senderAddress,
          senderPublicKey: wallet.publicKey,
        },
        wallet.seed,
      );

      await broadcast(tx, nodeUrl);
      recovered_wavelets += amount;
    } catch (err) {
      errors++;
      logger.warn({ address: wallet.address, err, sweepId }, 'Sweep: tx failed');
    }

    processed++;

    emitter.emit('progress', {
      errors,
      event: 'progress',
      processed,
      recovered_wavelets,
      status: 'running',
      total,
    } satisfies SweepProgressEvent);
  }

  logger.info({ errors, processed, recovered_wavelets, sweepId, user }, 'Sweep: complete');
  emitter.emit('done', {
    errors,
    event: 'done',
    processed,
    recovered_wavelets,
    status: 'done',
    total,
  } satisfies SweepDoneEvent);
  sweepJobs.delete(sweepId);
}

// ── Routes ───────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const sweepId = new URL(request.url).searchParams.get('sweepId');
  if (!sweepId) return new Response('Missing sweepId', { status: 400 });

  const emitter = sweepJobs.get(sweepId);
  if (!emitter) return new Response('Sweep not found or already completed', { status: 404 });

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      let cleaned = false;

      const send = (data: object) => {
        if (cleaned) return;
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* controller closed */
        }
      };

      const cleanup = () => {
        if (cleaned) return;
        cleaned = true;
        emitter.removeAllListeners();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
        sweepJobs.delete(sweepId);
        logger.info({ sweepId, user }, 'Sweep stream closed');
      };

      emitter.on('progress', send);
      emitter.on('error', (data: SweepErrorEvent) => {
        send(data);
        cleanup();
      });
      emitter.on('done', (data: SweepDoneEvent) => {
        send(data);
        cleanup();
      });

      request.signal.addEventListener('abort', cleanup);
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
    const nodeUrl =
      typeof body.nodeUrl === 'string'
        ? body.nodeUrl
        : (process.env.DCC_NODE_URL ?? 'https://testnet-node.decentralchain.io');

    const chainId =
      typeof body.chainId === 'string' && body.chainId.length === 1 ? body.chainId : '!';

    // Accept either a pre-computed address or a seed phrase (server derives the address).
    // Accepting the seed keeps it off the client entirely when auto-sweep triggers.
    let senderAddress = typeof body.senderAddress === 'string' ? body.senderAddress : '';
    if (!senderAddress) {
      const senderSeed = typeof body.senderSeed === 'string' ? body.senderSeed.trim() : '';
      if (!senderSeed) {
        return Response.json(
          { error: 'Either senderAddress or senderSeed is required' },
          { status: 400 },
        );
      }
      try {
        senderAddress = address(senderSeed, chainId);
      } catch {
        return Response.json({ error: 'Invalid senderSeed' }, { status: 400 });
      }
    }

    const sweepId = crypto.randomUUID();
    const emitter = new EventEmitter();
    sweepJobs.set(sweepId, emitter);

    logger.info({ chainId, nodeUrl, senderAddress, sweepId, user }, 'Sweep started');

    // Fire-and-forget — errors are emitted through the EventEmitter
    runSweep(sweepId, emitter, nodeUrl, chainId, senderAddress, user).catch((err) => {
      logger.error({ err, sweepId }, 'Sweep: unhandled error');
      sweepJobs.delete(sweepId);
    });

    return Response.json({ sweepId });
  }

  return new Response('Unknown intent', { status: 400 });
}
