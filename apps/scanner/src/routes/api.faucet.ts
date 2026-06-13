/**
 * Faucet API — POST /api/faucet
 *
 * Validates a DCC address, optionally verifies a reCAPTCHA v3 token, applies a
 * per-address rate limit, then signs and broadcasts a transfer from the faucet
 * wallet. All configuration comes from runtime Docker env vars:
 *
 *   DCC_FAUCET_SEED          Wallet seed for the faucet account (required)
 *   DCC_FAUCET_AMOUNT        Whole DCC to send per request (default: 10)
 *   DCC_FAUCET_RATE_HOURS    Hours between requests per address (default: 24)
 *   DCC_RECAPTCHA_SECRET     reCAPTCHA v3 secret key (optional — skips check if unset)
 *   DCC_NODE_URL             Node REST API base URL
 */

import { broadcast, transfer } from '@decentralchain/transactions';

// ── In-memory rate limiter ────────────────────────────────────────────────────
// Keyed by address → last successful request timestamp (ms).
// Single-process: one Node.js SSR server per container, so this is safe.
const lastRequest = new Map<string, number>();

function isRateLimited(address: string, windowMs: number): boolean {
  const last = lastRequest.get(address);
  return last !== undefined && Date.now() - last < windowMs;
}

// ── reCAPTCHA v3 verification ─────────────────────────────────────────────────
async function verifyRecaptcha(token: string, secret: string): Promise<boolean> {
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    body: `secret=${encodeURIComponent(secret)}&response=${encodeURIComponent(token)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    method: 'POST',
  });
  const json = (await res.json()) as { score?: number; success: boolean };
  // Score >= 0.5 is human-like; 0 = bot
  return json.success && (json.score ?? 1) >= 0.5;
}

// ── Resource route action ─────────────────────────────────────────────────────
export async function action({ request }: { request: Request }): Promise<Response> {
  const seed = process.env.DCC_FAUCET_SEED;
  if (!seed) {
    return Response.json({ error: 'Faucet not configured on this network' }, { status: 503 });
  }

  if (request.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { address?: unknown; captchaToken?: unknown };
  try {
    body = (await request.json()) as { address?: unknown; captchaToken?: unknown };
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const captchaToken = typeof body.captchaToken === 'string' ? body.captchaToken : '';

  // ── Validate address ────────────────────────────────────────────────────────
  // DCC mainnet/testnet/stagenet addresses: 35-char base58, start with '3'
  if (!/^3[1-9A-HJ-NP-Za-km-z]{34}$/.test(address)) {
    return Response.json({ error: 'Invalid DCC address' }, { status: 400 });
  }

  // ── reCAPTCHA ───────────────────────────────────────────────────────────────
  const recaptchaSecret = process.env.DCC_RECAPTCHA_SECRET;
  if (recaptchaSecret) {
    if (!captchaToken) {
      return Response.json({ error: 'CAPTCHA token required' }, { status: 400 });
    }
    const valid = await verifyRecaptcha(captchaToken, recaptchaSecret);
    if (!valid) {
      return Response.json(
        { error: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 },
      );
    }
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const rateLimitHours = parseInt(process.env.DCC_FAUCET_RATE_HOURS ?? '24', 10);
  const rateLimitMs = rateLimitHours * 3600 * 1000;
  if (isRateLimited(address, rateLimitMs)) {
    return Response.json(
      { error: `This address already received DCC. Try again in ${rateLimitHours} hours.` },
      { status: 429 },
    );
  }

  // ── Build, sign, and broadcast the transfer ─────────────────────────────────
  const nodeUrl = process.env.DCC_NODE_URL ?? 'https://mainnet-node.decentralchain.io';
  const amountDcc = parseInt(process.env.DCC_FAUCET_AMOUNT ?? '10', 10);
  // 1 DCC = 10^8 units (same decimal structure as WAVES)
  const amountUnits = amountDcc * 1e8;

  try {
    const tx = transfer(
      {
        amount: amountUnits,
        attachment: '',
        fee: 100000, // 0.001 DCC
        recipient: address,
      },
      seed,
    );

    await broadcast(tx, nodeUrl);

    lastRequest.set(address, Date.now());

    return Response.json({
      amount: amountDcc,
      success: true,
      txId: tx.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to broadcast transaction';
    return Response.json({ error: message }, { status: 500 });
  }
}
