/**
 * Regression tests for the formulas actually deployed in PoolCore.ride and
 * SwapRouter.ride (see ride-formulas.ts for why this exists and its limits).
 *
 * Every fixture marked "live mainnet" was captured from a real transaction
 * against the deployed contract during this session's testing — not just
 * hand-computed — so these tests catch drift against verified ground truth,
 * not just internal self-consistency.
 */
import {
  exceedsReserveCap,
  isqrt,
  MAX_RESERVE,
  sqrtProduct,
  sumMatchingPayments,
  swapAmountOut,
} from '../src/core/ride-formulas';

describe('isqrt', () => {
  it('floors non-perfect squares', () => {
    expect(isqrt(1000000000n)).toBe(31622n); // sqrt ≈ 31622.776
    expect(isqrt(100000000000n)).toBe(316227n); // sqrt ≈ 316227.766
  });

  it('is exact for perfect squares', () => {
    expect(isqrt(100000000000000n)).toBe(10000000n); // 10^7 squared = 10^14
    expect(isqrt(4n)).toBe(2n);
  });

  it('handles the small-input special cases', () => {
    expect(isqrt(0n)).toBe(0n);
    expect(isqrt(1n)).toBe(1n);
    expect(isqrt(3n)).toBe(1n);
  });

  it("throws on negative input, matching RIDE's E_SQRT_NEG", () => {
    expect(() => isqrt(-1n)).toThrow('E_SQRT_NEG');
  });
});

describe('sqrtProduct', () => {
  it('matches the live first addLiquidity deposit exactly (mainnet, 10 DCC / 1000 Test)', () => {
    // desired0=1_000_000_000 (10 DCC), desired1=100_000_000_000 (1000 Test @ 8dp)
    // On-chain result was lpSupply=9_999_730_195 — verified via GET /addresses/data.
    expect(sqrtProduct(1000000000n, 100000000000n)).toBe(9999730195n);
  });

  it('is exact when a*b is a perfect square with no rounding in either isqrt', () => {
    expect(sqrtProduct(100000000n, 100000000n)).toBe(100000000n);
  });

  it('never overshoots floor(sqrt(a*b)) by more than 1, and never undershoots by more than sqrt(a)+sqrt(b)', () => {
    // NOTE ON THIS BOUND: an earlier security audit (and this file, in an
    // earlier revision) claimed sqrtProduct is always within {floor(sqrt(ab)),
    // floor(sqrt(ab))+1} — i.e. off by at most 1. That claim is WRONG. It
    // conflated "isqrt(a)*isqrt(b) <= sqrt(a)*sqrt(b) always" (true — approx
    // can never overshoot the true value on its own) with "...and therefore
    // the gap is at most 1" (does not follow — the compounding rounding loss
    // from two independent floor(sqrt(·)) calls scales with the magnitude of
    // a and b, not a constant). Verified by direct counterexample: a=123456789,
    // b=987654321 undershoots by 14246, not <=1. A 200k-sample sweep up to
    // MAX_RESERVE found worst-case relative error ~4e-5 (0.004%) — genuinely
    // negligible for LP-share purposes, but "negligible" and "bounded by 1"
    // are very different claims, and only one of them is true.
    const cases: Array<[bigint, bigint]> = [
      [4n, 1001000n],
      [99999999999999n, 1n],
      [4n, 6n],
      [123456789n, 987654321n],
      [1n, MAX_RESERVE],
      [216224903n, 66879683308789n], // empirically the worst case found in the sweep
    ];
    for (const [a, b] of cases) {
      const result = sqrtProduct(a, b);
      const exact = (() => {
        const x = a * b;
        if (x < 2n) return x;
        let lo = 0n,
          hi = x;
        while (lo < hi) {
          const mid = (lo + hi + 1n) / 2n;
          if (mid * mid <= x) lo = mid;
          else hi = mid - 1n;
        }
        return lo;
      })();
      const sqrtCeil = (x: bigint) => {
        if (x <= 1n) return x;
        let lo = 0n,
          hi = x;
        while (lo < hi) {
          const mid = (lo + hi + 1n) / 2n;
          if (mid * mid <= x) lo = mid;
          else hi = mid - 1n;
        }
        return lo + 1n;
      };
      const maxUndershoot = sqrtCeil(a) + sqrtCeil(b);
      expect(result).toBeGreaterThanOrEqual(exact - maxUndershoot);
      expect(result).toBeLessThanOrEqual(exact + 1n);
    }
  });

  it('keeps the worst-case relative error negligible (<0.01%) even at max-reserve scale', () => {
    const a = 216224903n;
    const b = 66879683308789n;
    const result = sqrtProduct(a, b);
    const exact = (() => {
      const x = a * b;
      let lo = 0n,
        hi = x;
      while (lo < hi) {
        const mid = (lo + hi + 1n) / 2n;
        if (mid * mid <= x) lo = mid;
        else hi = mid - 1n;
      }
      return lo;
    })();
    const relativeErrorPct = Number(((exact - result) * 1000000n) / exact) / 10000;
    expect(relativeErrorPct).toBeLessThan(0.01);
  });

  it('reproduces the known off-by-one overshoot (audit finding, confirmed live via evaluate)', () => {
    // floor(sqrt(4 * 1001000)) = floor(sqrt(4004000)) = 2000, but the
    // fraction()-based correction step's inequality is a floor-divided
    // proxy, not the exact squared comparison, so it overshoots to 2001.
    expect(sqrtProduct(4n, 1001000n)).toBe(2001n);
    expect(sqrtProduct(99999999999999n, 1n)).toBe(10000000n); // true value 9999999n
  });
});

describe('swapAmountOut', () => {
  it('matches the first live mainnet swap exactly (1 DCC in, 35bps fee)', () => {
    const out = swapAmountOut(100000000n, 1000000000n, 100000000000n, 35n);
    expect(out).toBe(9061974264n);
  });

  it('matches the second live mainnet swap exactly (post security-hardening deploy)', () => {
    const out = swapAmountOut(100000000n, 549985161n, 45467786059n, 35n);
    expect(out).toBe(6974476064n);
  });

  it('returns 0 rather than throwing when reserveIn is 0 (empty pool)', () => {
    expect(swapAmountOut(100000000n, 0n, 0n, 35n)).toBe(0n);
  });

  it('increases the k-invariant product (fee accrues to the pool)', () => {
    const amountIn = 100000000n,
      resIn = 1000000000n,
      resOut = 100000000000n,
      fee = 35n;
    const amountOut = swapAmountOut(amountIn, resIn, resOut, fee);
    const oldK = resIn * resOut;
    const newK = (resIn + amountIn) * (resOut - amountOut);
    expect(newK).toBeGreaterThanOrEqual(oldK);
  });
});

describe('exceedsReserveCap', () => {
  it('allows reserves at or under the cap', () => {
    expect(exceedsReserveCap(MAX_RESERVE, MAX_RESERVE)).toBe(false);
    expect(exceedsReserveCap(1000n, 1000n)).toBe(false);
  });

  it('flags either side exceeding the cap', () => {
    expect(exceedsReserveCap(MAX_RESERVE + 1n, 0n)).toBe(true);
    expect(exceedsReserveCap(0n, MAX_RESERVE + 1n)).toBe(true);
  });
});

describe('sumMatchingPayments (the duplicate-payment fund-loss fix)', () => {
  it('sums two payments of the same asset instead of taking the last one', () => {
    const result = sumMatchingPayments(
      [
        { amount: 500000000n, assetId: null },
        { amount: 1000000000n, assetId: null },
      ],
      null,
    );
    // Before the fix, paymentAmount() would have returned 1_000_000_000
    // (last-match-wins) even though the protocol actually transferred
    // 1_500_000_000 total — silently stranding the surplus.
    expect(result.total).toBe(1500000000n);
    expect(result.found).toBe(true);
  });

  it('ignores non-matching assets and reports not-found when there is no match', () => {
    const result = sumMatchingPayments([{ amount: 100n, assetId: 'SOME_OTHER_ASSET' }], null);
    expect(result.found).toBe(false);
    expect(result.total).toBe(0n);
  });

  it('sums three-plus duplicate entries correctly', () => {
    const result = sumMatchingPayments(
      [
        { amount: 10n, assetId: 'X' },
        { amount: 20n, assetId: 'X' },
        { amount: 999n, assetId: 'Y' },
        { amount: 30n, assetId: 'X' },
      ],
      'X',
    );
    expect(result.total).toBe(60n);
  });
});
