/**
 * Faucet API — POST /api/faucet
 *
 * Validates a DCC address for this network, atomically reserves it for the
 * rate window, then signs and broadcasts a transfer from the faucet wallet.
 * A failed broadcast releases the reservation so the user can retry.
 *
 * Abuse controls: the edge's per-IP rate limit in front of this route and the
 * per-address window here; the faucet balance is monitored via /api/health.
 *
 * Runtime env:
 *   DCC_FAUCET_SEED        Faucet wallet seed (required)
 *   DCC_FAUCET_AMOUNT      DCC per request, > 0 (default: 10)
 *   DCC_FAUCET_RATE_HOURS  Hours between requests per address, > 0 (default: 24)
 *   DCC_CHAIN_ID           Network byte; addresses for other networks are rejected
 *   DCC_NODE_URL           Node REST API base URL
 *   REDIS_URL              Shared reservation store (in-process fallback when unset)
 */

import { broadcast, transfer } from '@decentralchain/transactions';
import Redis from 'ioredis';
import { logError } from '@/lib/error-logger';
import { faucetSettings } from '@/lib/faucet-config';
import {
  type FaucetReservations,
  memoryReservations,
  redisReservations,
} from '@/lib/faucet-reservation';

const reservations: FaucetReservations = process.env.REDIS_URL
  ? redisReservations(new Redis(process.env.REDIS_URL))
  : memoryReservations();

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const NETWORK_NAMES: Record<number, string> = { 33: 'testnet', 63: 'mainnet', 83: 'stagenet' };
const GENERIC_FAILURE = 'Faucet transfer failed. Please try again later.';

/** DCC address bytes: [version=1, chainId, ...payload, ...checksum] — always 26 bytes. */
function decodeBase58(s: string): number[] {
  let n = 0n;
  for (const c of s) n = n * 58n + BigInt(BASE58_ALPHABET.indexOf(c));
  const bytes: number[] = [];
  while (n > 0n) {
    bytes.unshift(Number(n & 0xffn));
    n >>= 8n;
  }
  while (bytes.length < 26) bytes.unshift(0);
  return bytes;
}

/** The faucet only accepts POST; monitors use GET /api/health. */
export function loader(): Response {
  return Response.json(
    { error: 'Method not allowed. POST {"address": "<testnet address>"} to request DCC.' },
    { headers: { Allow: 'POST' }, status: 405 },
  );
}

export async function action({ request }: { request: Request }): Promise<Response> {
  const seed = process.env.DCC_FAUCET_SEED;
  const nodeUrl = process.env.DCC_NODE_URL;
  if (!seed || !nodeUrl) {
    return Response.json({ error: 'Faucet not configured on this network' }, { status: 503 });
  }

  if (request.method !== 'POST') {
    return Response.json(
      { error: 'Method not allowed' },
      { headers: { Allow: 'POST' }, status: 405 },
    );
  }

  let body: { address?: unknown };
  try {
    body = (await request.json()) as { address?: unknown };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!/^3[1-9A-HJ-NP-Za-km-z]{34}$/.test(address)) {
    return Response.json({ error: 'Invalid DCC address' }, { status: 400 });
  }

  const expectedChainId = process.env.DCC_CHAIN_ID
    ? Number.parseInt(process.env.DCC_CHAIN_ID, 10)
    : null;
  if (expectedChainId !== null) {
    const addrChainId = decodeBase58(address)[1] ?? 0;
    if (addrChainId !== expectedChainId) {
      const expected = NETWORK_NAMES[expectedChainId] ?? `chain ${expectedChainId}`;
      const provided = NETWORK_NAMES[addrChainId] ?? `chain ${addrChainId}`;
      return Response.json(
        { error: `This address is for ${provided}. Please provide a ${expected} address.` },
        { status: 400 },
      );
    }
  }

  // ── Reserve the address atomically, before any transfer exists ──────────────
  const { amountDcc, rateHours: rateLimitHours } = faucetSettings();
  const windowMs = Math.round(rateLimitHours * 3600 * 1000);
  let reserved: boolean;
  try {
    reserved = await reservations.reserve(address, windowMs);
  } catch (error) {
    logError(error, { context: 'faucet_reserve' });
    return Response.json({ error: 'Faucet temporarily unavailable' }, { status: 503 });
  }
  if (!reserved) {
    return Response.json(
      { error: `This address already received DCC. Try again in ${rateLimitHours} hours.` },
      { status: 429 },
    );
  }

  // ── Build, sign, and broadcast the transfer ─────────────────────────────────
  try {
    const tx = transfer(
      {
        amount: Math.round(amountDcc * 1e8), // 1 DCC = 10^8 base units
        attachment: '',
        fee: 100000, // 0.001 DCC
        recipient: address,
      },
      seed,
    );
    await broadcast(tx, nodeUrl);
    return Response.json({ amount: amountDcc, success: true, txId: tx.id });
  } catch (error) {
    // If the release fails too, the address simply stays reserved for the window.
    await reservations.release(address).catch((releaseError: unknown) => {
      logError(releaseError, { address, context: 'faucet_release' });
    });
    // Node rejection details stay in the server log; the client gets a generic message.
    logError(error, { address, context: 'faucet_broadcast' });
    return Response.json({ error: GENERIC_FAILURE }, { status: 502 });
  }
}
