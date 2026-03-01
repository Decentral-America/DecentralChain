import { fetchHeadersLast, fetchHeight } from '../../api-node/blocks';
import { wait } from '../utils';
import detectInterval from './detectInterval';

/** Cache entry with TTL to avoid serving stale interval data. */
interface ICacheEntry {
  interval: number;
  /** Timestamp (ms) when this entry was stored. */
  storedAt: number;
}

/** Interval cache: keyed by base URL, entries expire after 10 minutes. */
const storage: Record<string, ICacheEntry> = Object.create(null);
const CACHE_TTL_MS = 10 * 60 * 1000;

export default function (base: string, current?: number): Promise<{ height: number }> {
  return Promise.all([
    getInterval(base),
    current == undefined ? fetchHeight(base).then(({ height }) => height + 1) : current,
  ]).then(([interval, current]) => loop(interval, current));

  function loop(interval: number, current: number): Promise<{ height: number }> {
    return fetchHeadersLast(base).then(({ height, timestamp }) => {
      if (height >= current) {
        return { height };
      }

      const blocksToWait = current - height;
      const now = Date.now();
      const timeout =
        ((blocksToWait - 1) * interval + (interval - Math.abs(now - timestamp))) * 0.8;
      return wait(inRange(timeout, 200, interval * blocksToWait * 0.8)).then(() =>
        loop(interval, current),
      );
    });
  }
}

function inRange(current: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max(current, min), max));
}

function getInterval(base: string): Promise<number> {
  const cached = storage[base];
  if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) {
    return Promise.resolve(cached.interval);
  } else {
    return detectInterval(base).then((interval) => {
      storage[base] = { interval, storedAt: Date.now() };
      return interval;
    });
  }
}
