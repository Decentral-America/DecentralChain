import { describe, expect, it } from 'vitest';
import { memoryReservations, type RedisLike, redisReservations } from './faucet-reservation';

/** Implements exactly the SET … PX … NX contract the reservation relies on. */
function fakeRedis(): RedisLike {
  const store = new Map<string, number>();
  return {
    async del(key) {
      return store.delete(key) ? 1 : 0;
    },
    async set(key, _value, _px, ms, _nx) {
      const expiresAt = store.get(key);
      if (expiresAt !== undefined && expiresAt > Date.now()) return null;
      store.set(key, Date.now() + ms);
      return 'OK';
    },
  };
}

describe.each([
  ['redis', () => redisReservations(fakeRedis())],
  ['memory', () => memoryReservations()],
])('%s reservations', (_name, make) => {
  it('grants exactly one of many concurrent reservations for an address', async () => {
    const reservations = make();
    const results = await Promise.all(
      Array.from({ length: 10 }, () => reservations.reserve('31addr', 60_000)),
    );
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('frees the address again on release', async () => {
    const reservations = make();
    expect(await reservations.reserve('31addr', 60_000)).toBe(true);
    await reservations.release('31addr');
    expect(await reservations.reserve('31addr', 60_000)).toBe(true);
  });

  it('keeps addresses independent', async () => {
    const reservations = make();
    expect(await reservations.reserve('31a', 60_000)).toBe(true);
    expect(await reservations.reserve('31b', 60_000)).toBe(true);
  });
});

describe('memoryReservations window', () => {
  it('allows the address again once the window has passed', async () => {
    let now = 1_000;
    const reservations = memoryReservations(() => now);
    expect(await reservations.reserve('31addr', 500)).toBe(true);
    now = 1_400;
    expect(await reservations.reserve('31addr', 500)).toBe(false);
    now = 1_600;
    expect(await reservations.reserve('31addr', 500)).toBe(true);
  });
});
