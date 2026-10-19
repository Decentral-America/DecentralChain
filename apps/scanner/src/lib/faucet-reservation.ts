/**
 * Per-address faucet reservations.
 *
 * Reserving is one atomic step (Redis `SET key value PX ttl NX`), taken BEFORE
 * the transfer is broadcast. The previous check-then-set (GET, broadcast, SET)
 * let concurrent requests for one address all pass the check. A failed
 * broadcast releases the reservation so the user can retry.
 */

export interface FaucetReservations {
  /** True when this caller now holds the address for `windowMs`; false when it is already held. */
  reserve(address: string, windowMs: number): Promise<boolean>;
  release(address: string): Promise<void>;
}

/** The subset of ioredis this module uses. */
export interface RedisLike {
  set(key: string, value: string, px: 'PX', ms: number, nx: 'NX'): Promise<'OK' | null>;
  del(key: string): Promise<number>;
}

/** Same key the earlier implementation wrote, so live reservations stay honored across the deploy. */
const keyFor = (address: string): string => `faucet:last-request:${address}`;

export function redisReservations(redis: RedisLike): FaucetReservations {
  return {
    async release(address) {
      await redis.del(keyFor(address));
    },
    async reserve(address, windowMs) {
      return (await redis.set(keyFor(address), String(Date.now()), 'PX', windowMs, 'NX')) === 'OK';
    },
  };
}

/**
 * In-process fallback for networks without REDIS_URL. Atomic within one
 * process (the check and the write run without an intervening await); resets
 * on restart, which is why production sets REDIS_URL.
 */
export function memoryReservations(now: () => number = Date.now): FaucetReservations {
  const heldUntil = new Map<string, number>();
  return {
    async release(address) {
      heldUntil.delete(address);
    },
    async reserve(address, windowMs) {
      const t = now();
      const until = heldUntil.get(address);
      if (until !== undefined && until > t) return false;
      heldUntil.set(address, t + windowMs);
      return true;
    },
  };
}
