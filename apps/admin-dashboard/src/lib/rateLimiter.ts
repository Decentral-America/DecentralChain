/**
 * Per-key rate limiter and idempotency-key cache, in-process, zero-dependency.
 *
 * Mirrors the design of `data-service/src/middleware/rateLimiter.ts` (fixed-window
 * counter, single-instance only — this admin tool runs one instance). Keyed by
 * authenticated username rather than IP, since every route this guards already
 * requires a valid session.
 */

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

export function createRateLimiter({ windowMs = 60_000, max = 5 } = {}) {
  const windows = new Map<string, RateLimitWindow>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, win] of windows) {
      if (win.resetAt < now) windows.delete(key);
    }
  }, windowMs);
  cleanup.unref();

  return function checkRateLimit(
    key: string,
  ): { ok: true } | { ok: false; retryAfterSeconds: number } {
    const now = Date.now();
    const win = windows.get(key);

    if (win === undefined || win.resetAt < now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return { ok: true };
    }

    win.count += 1;
    if (win.count > max) {
      return { ok: false, retryAfterSeconds: Math.ceil((win.resetAt - now) / 1000) };
    }
    return { ok: true };
  };
}

interface IdempotencyEntry {
  result: unknown;
  expiresAt: number;
}

const IDEMPOTENCY_TTL_MS = 5 * 60_000;

export function createIdempotencyCache<T>() {
  const cache = new Map<string, IdempotencyEntry>();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (entry.expiresAt < now) cache.delete(key);
    }
  }, IDEMPOTENCY_TTL_MS);
  cleanup.unref();

  return {
    get(key: string): T | undefined {
      const entry = cache.get(key);
      if (!entry || entry.expiresAt < Date.now()) return;
      return entry.result as T;
    },
    set(key: string, result: T): void {
      cache.set(key, { expiresAt: Date.now() + IDEMPOTENCY_TTL_MS, result });
    },
  };
}
