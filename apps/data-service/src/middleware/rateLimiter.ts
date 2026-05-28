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
 * IP resolution
 * ─────────────
 * Trusts X-Real-IP set by Caddy (infra/terraform/scripts/bootstrap.sh).
 * Data-service is loopback-bound (127.0.0.1:8080) — Caddy is the only
 * reachable ingress, so X-Real-IP cannot be spoofed by external clients.
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
}

/**
 * Creates a Hono middleware that enforces per-IP request rate limits.
 *
 * @example
 * ```ts
 * app.use(createRateLimiter({ windowMs: 60_000, max: 120 }));
 * ```
 */
export function createRateLimiter({ windowMs = 60_000, max = 120 }: RateLimiterOptions = {}) {
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
    // X-Real-IP is set by Caddy from the actual client remote address.
    // X-Forwarded-For is a secondary fallback for local dev without Caddy.
    const ip =
      c.req.header('x-real-ip') ??
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
      'unknown';

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
