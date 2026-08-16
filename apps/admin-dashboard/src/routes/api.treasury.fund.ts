import { broadcast, massTransfer, waitForTx } from '@decentralchain/transactions';
import { address } from '@decentralchain/ts-lib-crypto';
import { type ActionFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createIdempotencyCache, createRateLimiter } from '@/lib/rateLimiter';
import { generateWallets, insertFundedWallets } from '@/lib/treasuryWallets';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

const MAX_RECIPIENTS_PER_TX = 100;
const BASE_MASS_TRANSFER_FEE = 100_000;
const WAVELETS_PER_DCC = 100_000_000;

// One fund attempt per user per 30s — this route can broadcast up to 2000 MassTransfer
// recipients per call; nothing should be hitting it faster than that.
const checkRateLimit = createRateLimiter({ max: 1, windowMs: 30_000 });
const idempotencyCache = createIdempotencyCache<{ errors: string[]; txIds: string[] }>();

function isAllowedNodeUrl(nodeUrl: string): boolean {
  const allowlist = (process.env.ADMIN_DASHBOARD_ALLOWED_NODE_URLS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowlist.length === 0) {
    if (process.env.NODE_ENV === 'production') return false;
    logger.warn(
      'ADMIN_DASHBOARD_ALLOWED_NODE_URLS is not set — allowing any nodeUrl in non-production only',
    );
    return true;
  }
  try {
    const origin = new URL(nodeUrl).origin;
    return allowlist.includes(origin);
  } catch {
    return false;
  }
}

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

  const rateLimitResult = checkRateLimit(user);
  if (!rateLimitResult.ok) {
    return Response.json(
      { error: 'Too many fund attempts — wait before retrying' },
      { headers: { 'Retry-After': String(rateLimitResult.retryAfterSeconds) }, status: 429 },
    );
  }

  const body = (await request.json()) as Record<string, unknown>;
  const intent = body.intent;

  if (intent !== 'fund') return new Response('Unknown intent', { status: 400 });

  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null;
  if (idempotencyKey) {
    const cached = idempotencyCache.get(idempotencyKey);
    if (cached) {
      logger.info({ idempotencyKey, user }, 'Treasury fund: returning cached idempotent response');
      return Response.json(cached);
    }
  }

  // Fall back to the server-configured treasury wallet when the caller leaves
  // the seed field blank, so auto-fund works without pasting a seed into the
  // browser every run. An explicitly supplied seed still overrides it.
  if (typeof body.senderSeed !== 'string' || body.senderSeed.trim() === '') {
    if (!process.env.TREASURY_SEED) {
      return Response.json(
        { error: 'No senderSeed provided and TREASURY_SEED is not configured on the server' },
        { status: 400 },
      );
    }
    body.senderSeed = process.env.TREASURY_SEED;
  }

  const validation = validateFundParams(body);
  if (!validation.ok) {
    return Response.json({ error: validation.error }, { status: 400 });
  }

  const { senderSeed, nodeUrl, chainId, count, amountDcc } = validation.params;

  if (!isAllowedNodeUrl(nodeUrl)) {
    logger.warn({ nodeUrl, user }, 'Treasury fund: rejected nodeUrl not in allowlist');
    return Response.json(
      { error: 'nodeUrl is not in ADMIN_DASHBOARD_ALLOWED_NODE_URLS' },
      { status: 400 },
    );
  }
  // Wallets generated fresh here, not read from an external file — a fund call
  // is now fully self-contained and self-tracking. Persisted to the DB (below)
  // right after each batch actually broadcasts, so a crash mid-fund never
  // leaves generated wallets neither tracked nor recoverable.
  const fundBatchId = crypto.randomUUID();
  const targets = generateWallets(count, chainId);
  const amountWavelets = Math.floor(amountDcc * WAVELETS_PER_DCC);

  // Batch into groups of MAX_RECIPIENTS_PER_TX (MassTransfer limit)
  const batches: (typeof targets)[] = [];
  for (let i = 0; i < targets.length; i += MAX_RECIPIENTS_PER_TX) {
    batches.push(targets.slice(i, i + MAX_RECIPIENTS_PER_TX));
  }

  const senderAddr = address(senderSeed, chainId);
  logger.info(
    { batchCount: batches.length, chainId, count, fundBatchId, nodeUrl, sender: senderAddr, user },
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
      // Only wallets that actually broadcast get tracked — a failed batch's
      // wallets were never funded, so there's nothing for a sweep to find later.
      await insertFundedWallets(batch, fundBatchId, amountWavelets, tx.id, user);
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
      fundBatchId,
      txCount: txIds.length,
      user,
    },
    'Treasury fund: complete',
  );

  const result = { errors: allErrors, fundBatchId, txIds };
  if (idempotencyKey) idempotencyCache.set(idempotencyKey, result);
  return Response.json(result);
}
