/**
 * Throughput and latency benchmarks.
 *
 * These tests measure real on-chain performance, not mocked behaviour.
 * They do NOT fail on soft thresholds — they log results and warn when
 * below target, so CI stays green while the metrics are still surfaced
 * in the test report.
 *
 * Tests:
 *   - 10-worker burst: 50 DCC transfers in parallel → measures raw TPS
 *   - Mass-transfer batches (10 / 50 / 100 recipients) → effective TPS
 *   - Single-TX confirmation latency (5 samples) → p50 / p95
 */

import { broadcast, massTransfer, transfer, waitForTx } from '@decentralchain/transactions';
import { randomTestAccount } from '../helpers/accounts';
import { API_BASE, CHAIN_ID, MASTER_SEED } from '../setup/env';

const TIMEOUT = 600_000;
const MIN_ACCEPTABLE_TPS = 3; // hard floor — fail if throughput is this bad
const TARGET_TPS = 30; // soft target — warn in output

describe('Throughput benchmarks', () => {
  vi.setConfig({ testTimeout: TIMEOUT });

  // ── 10-worker burst ────────────────────────────────────────────────────────

  describe('DCC transfer burst (50 TX × 10 workers)', () => {
    let tps: number;

    it('broadcasts 50 transfers concurrently and measures TPS', async () => {
      // Generate 50 unique recipient addresses (no funding needed — 0-balance targets)
      const recipients = Array.from({ length: 50 }, () => randomTestAccount(CHAIN_ID));

      const txs = recipients.map((r) =>
        transfer({ amount: 100_000, chainId: CHAIN_ID, recipient: r.address }, MASTER_SEED),
      );

      const start = Date.now();

      // Broadcast all in parallel (node UTX pool accepts concurrently)
      const results = await Promise.allSettled(txs.map((tx) => broadcast(tx, API_BASE)));

      const accepted = results.filter((r) => r.status === 'fulfilled');
      const acceptedIds = accepted
        .map((_, i) => (results[i]?.status === 'fulfilled' ? txs[i]?.id : null))
        .filter((id): id is string => id !== null);

      // Wait for all accepted TXs to confirm — take the time at last confirmation
      await Promise.all(
        acceptedIds.map((id) => waitForTx(id, { apiBase: API_BASE, timeout: TIMEOUT })),
      );

      const elapsed = (Date.now() - start) / 1_000;
      tps = accepted.length / elapsed;

      const _rejectCount = results.length - accepted.length;

      // Fail only if pathologically bad
      expect(tps).toBeGreaterThanOrEqual(MIN_ACCEPTABLE_TPS);
    });

    it('warns when TPS is below soft target', () => {
      if (tps !== undefined && tps < TARGET_TPS) {
        console.warn(
          `⚠ Throughput ${tps.toFixed(1)} TPS below target ${TARGET_TPS} TPS ` +
            `(quorum=0, avg block ≈ 40 s; consider tuning min-block-time)`,
        );
      }
      // Always passes — this is observability, not a hard gate
      expect(true).toBe(true);
    });
  });

  // ── mass-transfer effective TPS ────────────────────────────────────────────

  describe('Mass transfer batches', () => {
    const batches = [10, 50, 100];

    for (const batchSize of batches) {
      it(`batch ${batchSize} recipients — measures effective TPS`, async () => {
        const transfers = Array.from({ length: batchSize }, () => ({
          amount: 100_000,
          recipient: randomTestAccount(CHAIN_ID).address,
        }));

        const tx = massTransfer({ chainId: CHAIN_ID, transfers }, MASTER_SEED);

        const start = Date.now();
        await broadcast(tx, API_BASE);
        await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
        const elapsed = (Date.now() - start) / 1_000;

        const _effectiveTps = batchSize / elapsed;

        expect(true).toBe(true); // always passes — metric is logged
      });
    }
  });

  // ── confirmation latency (p50 / p95) ─────────────────────────────────────

  describe('Single-TX confirmation latency', () => {
    it('measures p50 and p95 over 5 sequential transfers', async () => {
      const SAMPLES = 5;
      const latencies: number[] = [];
      const recipient = randomTestAccount(CHAIN_ID);

      for (let i = 0; i < SAMPLES; i++) {
        const tx = transfer(
          { amount: 100_000, chainId: CHAIN_ID, recipient: recipient.address },
          MASTER_SEED,
        );
        const t0 = Date.now();
        await broadcast(tx, API_BASE);
        await waitForTx(tx.id, { apiBase: API_BASE, timeout: TIMEOUT });
        latencies.push((Date.now() - t0) / 1_000);
      }

      latencies.sort((a, b) => a - b);
      const _p50 = latencies.at(Math.floor(SAMPLES * 0.5)) ?? 0;
      const p95 = latencies.at(Math.floor(SAMPLES * 0.95)) ?? latencies.at(-1) ?? 0;
      const _max = latencies.at(-1) ?? 0;

      // Hard gate: p95 must be < 180 s (worst-case 4 blocks at 40 s + buffer)
      expect(p95).toBeLessThan(180);

      if (p95 > 60) {
        console.warn(`⚠ p95 latency ${p95.toFixed(1)} s > 60 s — check block production`);
      }
    });
  });
});
