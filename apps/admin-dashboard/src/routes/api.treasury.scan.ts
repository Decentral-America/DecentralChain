import { type LoaderFunctionArgs } from 'react-router';
import { fetchBalanceDetails } from '@/lib/api';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { readWalletCsv, type WalletEntry } from '@/lib/wallets';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

const SCAN_BATCH_SIZE = 50;
const DUST_THRESHOLD_WAVELETS = 1_000;

// ── Streaming loader ──────────────────────────────────────────────────────────
// Scans 2000 wallets in batches of 50 and streams progress as SSE events so the
// client can render results incrementally rather than waiting for all 40+ batches.
//
// Event types:
//   data: { type: 'progress', processed: N, total: N }
//   data: { type: 'wallet', address, available, generating, funded }
//   data: { type: 'done', processed: N, funded: N, totalAvailable: N }
//   data: { type: 'error', message }

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const nodeUrl =
    new URL(request.url).searchParams.get('nodeUrl') ??
    process.env.DCC_NODE_URL ??
    'https://testnet-node.decentralchain.io';

  const csvPath = process.env.DCC_WALLET_CSV_PATH ?? '/opt/dcc/test-wallets.csv';

  let wallets: WalletEntry[];
  try {
    wallets = readWalletCsv(csvPath);
  } catch (err) {
    const isEnoent =
      err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT';
    const message = isEnoent
      ? `Wallet CSV not found at "${csvPath}". Upload the file to that path on the server, or set the DCC_WALLET_CSV_PATH environment variable to its location.`
      : err instanceof Error
        ? err.message
        : 'Failed to read wallet CSV';
    logger.error({ csvPath, err }, 'Treasury scan: failed to read CSV');
    const enc = new TextEncoder();
    const errStream = new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ message, type: 'error' })}\n\n`));
        controller.close();
      },
    });
    return new Response(errStream, sseHeaders());
  }

  logger.info({ count: wallets.length, nodeUrl, user }, 'Treasury scan: started (SSE)');

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const total = wallets.length;
      let processed = 0;
      let funded = 0;
      let totalAvailable = 0;

      const enqueue = (data: object) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          /* controller closed — client disconnected */
        }
      };

      for (let i = 0; i < wallets.length; i += SCAN_BATCH_SIZE) {
        if (request.signal.aborted) break;

        const batch = wallets.slice(i, i + SCAN_BATCH_SIZE);
        const settled = await Promise.allSettled(
          batch.map((w) => fetchBalanceDetails(nodeUrl, w.address)),
        );

        // Emit the entire batch in one SSE event so the client does a single
        // setState call per batch (50 wallets) rather than 50 individual calls.
        // This reduces React array copy work from O(n²) to O(n × batchSize).
        const batchResults: Array<{
          address: string;
          available: number;
          generating: number;
          funded: boolean;
          scanError?: string;
        }> = [];

        for (let j = 0; j < batch.length; j++) {
          const wallet = batch[j];
          const result = settled[j];
          if (!wallet || !result) continue;

          if (result.status === 'fulfilled') {
            const { available, generating } = result.value;
            const isFunded = available > DUST_THRESHOLD_WAVELETS;
            if (isFunded) {
              funded++;
              totalAvailable += available;
            }
            batchResults.push({ address: wallet.address, available, funded: isFunded, generating });
          } else {
            batchResults.push({
              address: wallet.address,
              available: 0,
              funded: false,
              generating: 0,
              scanError: result.reason instanceof Error ? result.reason.message : 'scan failed',
            });
          }
          processed++;
        }

        enqueue({ type: 'batch', wallets: batchResults });
        enqueue({ processed, total, type: 'progress' });
      }

      enqueue({ funded, processed, totalAvailable, type: 'done' });
      logger.info({ funded, processed, totalAvailable, user }, 'Treasury scan: done');

      try {
        controller.close();
      } catch {
        /* already closed */
      }
    },
  });

  return new Response(stream, sseHeaders());
}

function sseHeaders(): ResponseInit {
  return {
    headers: {
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
      'X-Accel-Buffering': 'no',
    },
  };
}
