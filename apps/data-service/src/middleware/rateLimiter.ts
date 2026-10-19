import { isIP } from 'node:net';
import { getConnInfo } from '@hono/node-server/conninfo';
import { type Context, type Next } from 'hono';

/**
 * Rate Limiter Middleware — sliding window, in-process, zero-dependency.
 *
 * Design rationale
 * ───────────────
 * hono-rate-limiter (third-party) is at v0.5.3 and requires `unstorage` as
 * a peer dependency — too immature for financial infrastructure. A native
 * implementation is 40 lines, auditable, and has zero supply-chain surface.
 *
 * Algorithm: fixed-window counter per IP (resets at windowMs boundaries).
 * Suitable for single-instance deployments. For multi-replica, replace
 * the Map with a Redis INCR / EXPIRE call using the existing postgres driver
 * or a dedicated Redis client.
 *
 * Client identification
 * ─────────────────────
 * data-service runs on the host network behind Caddy on the same host, and Caddy
 * overwrites X-Real-IP with the real client address. So for a loopback TCP peer
 * (127.0.0.0/8, ::1, IPv4-mapped) the key is X-Real-IP when it is a valid IP, then
 * the last X-Forwarded-For entry, then the peer itself. Any other peer is keyed by
 * its own address and every forwarding header is ignored. When the peer address is
 * unavailable (a runtime that does not expose the socket) all forwarding headers
 * are ignored too, since nothing proves they came from the proxy.
 * This is the same trust model as websocket-api.
 *
 * Response on limit exceeded: 429 Too Many Requests with Retry-After,
 * X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset headers
 * per IETF RFC 9110 §15.5.29 and the emerging RateLimit header field spec
 * (draft-ietf-httpapi-ratelimit-headers-07).
 */

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

export interface RateLimiterOptions {
  /**
   * Duration of the rate limit window in milliseconds.
   * @default 60_000 (1 minute)
   */
  windowMs?: number;
  /**
   * Maximum number of requests per IP per window.
   * @default 120 (2 req/s average over a 1-minute window)
   */
  max?: number;
  /**
   * TCP peer address of the request. Defaults to the Node socket's remote address.
   * Injectable for tests.
   */
  peerAddress?: (c: Context) => string | undefined;
}

/**
 * Creates a Hono middleware that enforces per-IP request rate limits.
 *
 * @example
 * ```ts
 * app.use(createRateLimiter({ windowMs: 60_000, max: 120 }));
 * ```
 */
const isLoopback = (address: string): boolean => {
  const v4 = address.toLowerCase().replace(/^::ffff:/, '');
  return isIP(v4) === 4 ? v4.startsWith('127.') : v4 === '::1';
};

const validIp = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed !== undefined && isIP(trimmed) !== 0 ? trimmed : undefined;
};

export const defaultPeerAddress = (c: Context): string | undefined => {
  try {
    return getConnInfo(c).remote.address;
  } catch {
    return undefined;
  }
};

/** The client a request is counted against (see "Client identification" above). */
export const clientKey = (c: Context, peer: string | undefined): string => {
  if (peer === undefined) return 'unknown';
  if (!isLoopback(peer)) return peer;
  return (
    validIp(c.req.header('x-real-ip')) ??
    validIp(c.req.header('x-forwarded-for')?.split(',').pop()) ??
    peer
  );
};

export function createRateLimiter({
  windowMs = 60_000,
  max = 120,
  peerAddress = defaultPeerAddress,
}: RateLimiterOptions = {}) {
  const windows = new Map<string, RateLimitWindow>();

  // Periodic cleanup to prevent unbounded Map growth when many unique IPs
  // connect. Runs once per window; removes only expired entries.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, win] of windows) {
      if (win.resetAt < now) windows.delete(key);
    }
  }, windowMs);
  // Allow Node.js process to exit cleanly even when this interval is live.
  cleanup.unref();

  return async function rateLimiter(c: Context, next: Next) {
    const ip = clientKey(c, peerAddress(c));

    const now = Date.now();
    const win = windows.get(ip);

    if (win === undefined || win.resetAt < now) {
      windows.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    win.count += 1;

    if (win.count > max) {
      const retryAfterSeconds = Math.ceil((win.resetAt - now) / 1000);
      return c.text('Too Many Requests', 429, {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Limit': String(max),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(win.resetAt / 1000)),
      });
    }

    return next();
  };
}
