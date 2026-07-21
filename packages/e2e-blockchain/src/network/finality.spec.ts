/**
 * Finality health — T0 (DeterministicFinality, authoritative) and T2 (HotStuff, observational).
 *
 * This suite exists because neither of today's two real finality incidents (T0 silently
 * pinned at the max-rollback lag ceiling due to an empty committed-generators committee;
 * T2 silently disabled for weeks by a stale image + config-schema mismatch) would have been
 * caught by any prior spec in this suite — nothing checked finality behavior at all.
 *
 * Covers:
 *   - /blocks/height/finalized — present, non-negative, and actually advancing (not stalled)
 *   - finality lag stays well below the 100-block max-rollback ceiling (the "stalled at max
 *     lag" failure mode from today)
 *   - /node/status hotStuffFinalizedHeight — soft/informational only: T2 is still
 *     advisory/config-gated by design, so its absence is not itself a failure, but if present
 *     it must be advancing too
 */

import { API_BASE } from '../setup/env';

const TIMEOUT = 180_000;
// Same max-rollback ceiling referenced throughout node-scala docs (dcc.blockchain.custom
// functionality-settings max-rollback-depth). A lag approaching this means finality has
// stalled, not just that it's within its normal per-period cadence.
const MAX_ROLLBACK = 100;
const SAFE_LAG_CEILING = MAX_ROLLBACK - 10;

async function height(): Promise<number> {
  const res = await fetch(`${API_BASE}blocks/height`);
  if (!res.ok) throw new Error(`blocks/height: HTTP ${res.status}`);
  const body = (await res.json()) as { height: number };
  return body.height;
}

async function finalizedHeight(): Promise<number> {
  const res = await fetch(`${API_BASE}blocks/height/finalized`);
  if (!res.ok) throw new Error(`blocks/height/finalized: HTTP ${res.status}`);
  const body = (await res.json()) as { height: number };
  return body.height;
}

async function hotStuffFinalizedHeight(): Promise<number | null> {
  const res = await fetch(`${API_BASE}node/status`);
  if (!res.ok) throw new Error(`node/status: HTTP ${res.status}`);
  const body = (await res.json()) as { hotStuffFinalizedHeight?: number };
  return body.hotStuffFinalizedHeight ?? null;
}

describe('Finality health', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  describe('T0 — DeterministicFinality (authoritative)', () => {
    it('/blocks/height/finalized is present and non-negative', async () => {
      const finalized = await finalizedHeight();
      expect(finalized).toBeGreaterThanOrEqual(0);
    });

    it('finality lag stays well below the max-rollback ceiling (not stalled)', async () => {
      const [tip, finalized] = await Promise.all([height(), finalizedHeight()]);
      const lag = tip - finalized;
      expect(lag).toBeGreaterThanOrEqual(0);
      expect(lag).toBeLessThan(SAFE_LAG_CEILING);
    });

    it('finalized height is actually advancing (catches a stalled/empty committee)', async () => {
      const before = await finalizedHeight();

      // Poll for up to 2 minutes — a full generation period boundary can take a while,
      // but a healthy chain must show real progress well within that window.
      const deadline = Date.now() + 120_000;
      let after = before;
      while (Date.now() < deadline && after <= before) {
        await new Promise((r) => setTimeout(r, 10_000));
        after = await finalizedHeight();
      }

      expect(after).toBeGreaterThan(before);
    }, 150_000);
  });

  describe('T2 — HotStuff (observational, config-gated — soft checks only)', () => {
    it('if present, hotStuffFinalizedHeight is advancing too', async () => {
      const before = await hotStuffFinalizedHeight();
      if (before === null) {
        console.warn(
          'hotStuffFinalizedHeight absent from /node/status — T2 is config-gated by design, not a failure',
        );
        return;
      }

      const deadline = Date.now() + 60_000;
      let after = before;
      while (Date.now() < deadline && after <= before) {
        await new Promise((r) => setTimeout(r, 10_000));
        const next = await hotStuffFinalizedHeight();
        if (next === null) {
          console.warn('hotStuffFinalizedHeight disappeared mid-poll — not asserting further');
          return;
        }
        after = next;
      }

      expect(after).toBeGreaterThan(before);
    }, 90_000);
  });
});
