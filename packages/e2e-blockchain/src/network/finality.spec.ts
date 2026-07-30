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
      // A single snapshot is the wrong probe here: lag legitimately spikes at a generation-period
      // boundary, when a batch of blocks is briefly unfinalized until the next QC lands, then comes
      // straight back down. That transient is normal cadence, not the failure mode this guards.
      // The real "pinned at max lag" incident (empty/stuck committed-generators committee) is
      // SUSTAINED — lag never recovers. So poll across a window and require lag to be healthy at
      // least once; only a lag that stays at/above the ceiling for the WHOLE window is a stall.
      const deadline = Date.now() + 90_000;
      const observed: number[] = [];
      let healthy = false;
      do {
        const [tip, finalized] = await Promise.all([height(), finalizedHeight()]);
        const lag = tip - finalized;
        expect(lag).toBeGreaterThanOrEqual(0);
        observed.push(lag);
        if (lag < SAFE_LAG_CEILING) {
          healthy = true;
          break;
        }
        if (Date.now() >= deadline) break;
        await new Promise((r) => setTimeout(r, 10_000));
      } while (Date.now() < deadline);
      expect(
        healthy,
        `T0 finality lag stayed >= ${SAFE_LAG_CEILING} for the whole ~90s window (sustained stall, not a boundary blip); observed lags=${observed.join(', ')}`,
      ).toBe(true);
    }, 120_000);

    it('finalized height is actually advancing (catches a stalled/empty committee)', async () => {
      // T0 DeterministicFinality finalizes per generation period in BATCHES, not per block like
      // T2 HotStuff: `finalized` legitimately stays flat for a whole period (tens of minutes at
      // generationPeriodLength=100) and then jumps ~a period at once, so `lag` oscillates 0..~period
      // instead of staying small. A fixed short "must advance within 2 min" window therefore fails
      // on a perfectly healthy chain that happens to be sampled mid-period — observed directly:
      // finalized sat at 93161 for >2 min, then jumped +126 to 93287. The genuine failure this
      // guards (empty/stuck committee) manifests differently: finalized never advances AND lag
      // climbs toward the max-rollback ceiling, or the chain tip itself stops. So: poll a bounded
      // window; pass on any real advance; if finalized stays flat, pass only while this is normal
      // mid-period progress (lag still healthy AND the tip keeps moving), and fail if lag reaches
      // the ceiling (real finality stall) or the tip is frozen (chain not producing at all).
      const before = await finalizedHeight();
      const tipBefore = await height();

      const deadline = Date.now() + 240_000;
      let after = before;
      let tip = tipBefore;
      let lag = tip - after;
      while (Date.now() < deadline && after <= before && lag < SAFE_LAG_CEILING) {
        await new Promise((r) => setTimeout(r, 10_000));
        after = await finalizedHeight();
        tip = await height();
        lag = tip - after;
      }

      if (after > before) return; // finalized advanced — unambiguously healthy

      // Flat for the whole window: acceptable ONLY if it's normal between-period behavior.
      expect(
        lag,
        `T0 finalized flat at ${after} for ~4 min AND lag ${lag} reached the ceiling ${SAFE_LAG_CEILING} — genuine finality stall, not a between-period gap`,
      ).toBeLessThan(SAFE_LAG_CEILING);
      expect(
        tip,
        `T0 finalized flat at ${after} AND the chain tip is frozen at ${tip} — the chain is not producing blocks`,
      ).toBeGreaterThan(tipBefore);
    }, 270_000);
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

      // A healthy chain tracks hotStuffFinalizedHeight within a few blocks of the tip in near
      // real time, so any genuine advance shows up quickly. A 60s window was too tight, though: it
      // failed the whole nightly on a single transient pause that had fully recovered minutes
      // later. Give it a realistic window so only a SUSTAINED T2 stall (minutes without a single
      // advance) trips it — consistent with this block being observational/soft by design.
      const deadline = Date.now() + 180_000;
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
    }, 210_000);
  });
});
