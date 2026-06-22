import { broadcast, massTransfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { type ActionFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { readWalletCsv } from '@/lib/wallets';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

const MAX_RECIPIENTS_PER_TX = 100;
const BASE_MASS_TRANSFER_FEE = 100_000;
const WAVELETS_PER_DCC = 100_000_000;

interface FundParams {
  senderSeed: string;
  nodeUrl: string;
  chainId: string;
  count: number;
  amountDcc: number;
}

function validateFundParams(
  body: Record<string, unknown>,
): { ok: true; params: FundParams } | { ok: false; error: string } {
  const { senderSeed, nodeUrl, chainId, count, amountDcc } = body;

  if (typeof senderSeed !== 'string' || senderSeed.trim().split(/\s+/).length < 12) {
    return { error: 'senderSeed must be at least 12 words', ok: false };
  }
  if (typeof nodeUrl !== 'string' || !/^https?:\/\/.+/.test(nodeUrl)) {
    return { error: 'nodeUrl must be a valid HTTP(S) URL', ok: false };
  }
  if (typeof chainId !== 'string' || chainId.length !== 1) {
    return { error: 'chainId must be exactly one character', ok: false };
  }
  const countNum = Number(count);
  if (!Number.isInteger(countNum) || countNum < 1 || countNum > 2000) {
    return { error: 'count must be an integer between 1 and 2000', ok: false };
  }
  const amountNum = Number(amountDcc);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return { error: 'amountDcc must be a positive number', ok: false };
  }

  return {
    ok: true,
    params: {
      amountDcc: amountNum,
      chainId,
      count: countNum,
      nodeUrl,
      senderSeed: senderSeed.trim(),
    },
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const intent = body.intent;

  if (intent !== 'fund') return new Response('Unknown intent', { status: 400 });

  const validation = validateFundParams(body);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { senderSeed, nodeUrl, chainId, count, amountDcc } = validation.params;
  const csvPath = process.env.DCC_WALLET_CSV_PATH ?? '/opt/dcc/test-wallets.csv';

  let wallets: ReturnType<typeof readWalletCsv>;
  try {
    wallets = readWalletCsv(csvPath);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read wallet CSV';
    logger.error({ csvPath, err }, 'Treasury fund: failed to read CSV');
    return Response.json({ error: message }, { status: 500 });
  }

  const targets = wallets.slice(0, count);
  const amountWavelets = Math.floor(amountDcc * WAVELETS_PER_DCC);

  // Batch into groups of MAX_RECIPIENTS_PER_TX (MassTransfer limit)
  const batches: (typeof targets)[] = [];
  for (let i = 0; i < targets.length; i += MAX_RECIPIENTS_PER_TX) {
    batches.push(targets.slice(i, i + MAX_RECIPIENTS_PER_TX));
  }

  const senderAddr = address(senderSeed, chainId);
  logger.info(
    { batchCount: batches.length, chainId, count, nodeUrl, sender: senderAddr, user },
    'Treasury fund: starting',
  );

  const txIds: string[] = [];
  const broadcastErrors: string[] = [];

  // Phase 1: broadcast all MassTransfer TXs (sequential — nonce ordering matters).
  for (const batch of batches) {
    const fee = BASE_MASS_TRANSFER_FEE + Math.ceil(batch.length * 0.5) * BASE_MASS_TRANSFER_FEE;
    try {
      const tx = massTransfer(
        {
          chainId,
          fee,
          transfers: batch.map((w) => ({ amount: amountWavelets, recipient: w.address })),
        },
        senderSeed,
      );
      await broadcast(tx, nodeUrl);
      txIds.push(tx.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'broadcast failed';
      broadcastErrors.push(message);
      logger.warn({ err }, 'Treasury fund: batch broadcast failed');
    }
  }

  // Phase 2: wait for all broadcast TXs to confirm on-chain in parallel.
  // Timeout per TX is 120s (one full block cycle). All waits run concurrently so
  // total wait is bounded by the slowest single TX, not the sum of all TXs.
  const CONFIRM_TIMEOUT_MS = 120_000;
  const confirmErrors: string[] = [];

  if (txIds.length > 0) {
    const confirmResults = await Promise.allSettled(
      txIds.map((id) => waitForTx(id, { apiBase: nodeUrl, timeout: CONFIRM_TIMEOUT_MS })),
    );
    for (let i = 0; i < confirmResults.length; i++) {
      const result = confirmResults[i];
      const id = txIds[i] ?? 'unknown';
      if (result?.status === 'rejected') {
        const message =
          result.reason instanceof Error ? result.reason.message : 'confirmation timeout';
        confirmErrors.push(`TX ${id}: ${message}`);
        logger.warn({ id }, 'Treasury fund: TX confirmation failed or timed out');
      }
    }
  }

  const allErrors = [...broadcastErrors, ...confirmErrors];
  logger.info(
    {
      broadcastErrors: broadcastErrors.length,
      confirmErrors: confirmErrors.length,
      txCount: txIds.length,
      user,
    },
    'Treasury fund: complete',
  );

  return Response.json({ errors: allErrors, txIds });
}
