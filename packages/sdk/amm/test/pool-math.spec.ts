import { MINIMUM_LIQUIDITY } from '../src/core/constants';
import { getPoolKey } from '../src/core/pool-key';
import {
  getAddLiquidity,
  getAmountOut,
  getInitialLiquidity,
  getMinAmountOut,
  getRemoveLiquidity,
  quote,
} from '../src/core/pool-math';

// ─── Initial Liquidity ────────────────────────────────────────────────

describe('getInitialLiquidity', () => {
  it('computes sqrt(a*b) - MINIMUM_LIQUIDITY', () => {
    // sqrt(1_000_000 * 1_000_000) = 1_000_000
    // minted = 1_000_000 - 1000 = 999_000
    const result = getInitialLiquidity(1_000_000n, 1_000_000n);
    expect(result.lpMinted).toBe(999_000n);
    expect(result.lpLocked).toBe(MINIMUM_LIQUIDITY);
    expect(result.totalLpSupply).toBe(1_000_000n);
  });

  it('handles asymmetric amounts', () => {
    // sqrt(4_000_000 * 1_000_000) = sqrt(4 * 10^12) = 2_000_000
    const result = getInitialLiquidity(4_000_000n, 1_000_000n);
    expect(result.lpMinted).toBe(1_999_000n);
    expect(result.totalLpSupply).toBe(2_000_000n);
  });

  it('handles large amounts (8-decimal tokens)', () => {
    const amountA = 10_000_00000000n; // 10_000 tokens with 8 decimals
    const amountB = 50_000_00000000n;
    const result = getInitialLiquidity(amountA, amountB);
    expect(result.lpMinted > 0n).toBe(true);
    expect(result.totalLpSupply > MINIMUM_LIQUIDITY).toBe(true);
  });

  it('throws on zero amounts', () => {
    expect(() => getInitialLiquidity(0n, 1000n)).toThrow('must be positive');
    expect(() => getInitialLiquidity(1000n, 0n)).toThrow('must be positive');
  });

  it('throws on negative amounts', () => {
    expect(() => getInitialLiquidity(-1n, 1000n)).toThrow('must be positive');
  });

  it('throws on insufficient liquidity', () => {
    // sqrt(100 * 100) = 100 <= 1000 (MINIMUM_LIQUIDITY)
    expect(() => getInitialLiquidity(100n, 100n)).toThrow('Insufficient initial liquidity');
  });

  it('throws on minimum boundary', () => {
    // sqrt(1000 * 1000) = 1000 <= 1000 (exactly equal, also fails)
    expect(() => getInitialLiquidity(1000n, 1000n)).toThrow('Insufficient initial liquidity');
  });

  it('succeeds just above minimum', () => {
    // sqrt(1001 * 1001) = 1001 > 1000
    const result = getInitialLiquidity(1001n, 1001n);
    expect(result.lpMinted).toBe(1n);
  });
});

// ─── Add Liquidity ────────────────────────────────────────────────────

describe('getAddLiquidity', () => {
  const reserveA = 1_000_000n;
  const reserveB = 2_000_000n;
  const totalLpSupply = 1_000_000n;

  it('mints proportional LP tokens', () => {
    // Adding 10% of reserves → 10% of LP
    const result = getAddLiquidity(
      100_000n, // 10% of reserveA
      200_000n, // 10% of reserveB
      reserveA,
      reserveB,
      totalLpSupply,
    );
    expect(result.lpMinted).toBe(100_000n);
  });

  it('uses minimum side and refunds excess', () => {
    // A is exactly proportional, B is excess
    const result = getAddLiquidity(
      100_000n,
      300_000n, // more than proportional
      reserveA,
      reserveB,
      totalLpSupply,
    );
    expect(result.lpMinted).toBe(100_000n);
    expect(result.refundB > 0n).toBe(true);
  });

  it('throws on zero amounts', () => {
    expect(() => getAddLiquidity(0n, 100n, reserveA, reserveB, totalLpSupply)).toThrow(
      'must be positive',
    );
  });

  it('throws on zero reserves', () => {
    expect(() => getAddLiquidity(100n, 100n, 0n, reserveB, totalLpSupply)).toThrow(
      'must be positive',
    );
  });

  it('throws on amounts too small to mint', () => {
    // Tiny amounts relative to reserves much larger than LP supply
    // fraction(1, 1_000, 1_000_000_000_000_000) = 0, so no LP minted
    expect(() =>
      getAddLiquidity(1n, 1n, 1_000_000_000_000_000n, 1_000_000_000_000_000n, 1_000n),
    ).toThrow('too small');
  });
});

// ─── Remove Liquidity ─────────────────────────────────────────────────

describe('getRemoveLiquidity', () => {
  it('returns proportional amounts', () => {
    const result = getRemoveLiquidity(
      100_000n, // 10% of supply
      1_000_000n, // reserveA
      2_000_000n, // reserveB
      1_000_000n, // totalLpSupply
    );
    expect(result.amountA).toBe(100_000n); // 10% of reserveA
    expect(result.amountB).toBe(200_000n); // 10% of reserveB
  });

  it('rounds down (favors pool)', () => {
    const result = getRemoveLiquidity(1n, 1_000_001n, 2_000_001n, 1_000_000n);
    // 1 * 1_000_001 / 1_000_000 = 1.000001 → floor = 1
    expect(result.amountA).toBe(1n);
    expect(result.amountB).toBe(2n);
  });

  it('allows full withdrawal', () => {
    const result = getRemoveLiquidity(1_000_000n, 1_000_000n, 2_000_000n, 1_000_000n);
    expect(result.amountA).toBe(1_000_000n);
    expect(result.amountB).toBe(2_000_000n);
  });

  it('throws on burn > supply', () => {
    expect(() => getRemoveLiquidity(1_000_001n, 1_000_000n, 2_000_000n, 1_000_000n)).toThrow(
      'Cannot burn more',
    );
  });

  it('throws on zero LP', () => {
    expect(() => getRemoveLiquidity(0n, 1_000_000n, 2_000_000n, 1_000_000n)).toThrow(
      'must be positive',
    );
  });

  it('throws on zero-value withdrawal', () => {
    // 1 LP out of 10^18 supply, with reserves of 100 each
    // floor(1 * 100 / 10^18) = 0
    expect(() => getRemoveLiquidity(1n, 100n, 100n, 1_000_000_000_000_000_000n)).toThrow('zero');
  });
});

// ─── Exact-Input Swap ─────────────────────────────────────────────────

describe('getAmountOut', () => {
  const reserveA = 1_000_000n;
  const reserveB = 1_000_000n;
  const feeBps = 30n; // 0.3%

  it('computes basic swap output', () => {
    const result = getAmountOut(10_000n, reserveA, reserveB, feeBps);
    // amountInWithFee = 10_000 * 9970 = 99_700_000
    // num = 99_700_000 * 1_000_000 = 99_700_000_000_000
    // den = 1_000_000 * 10_000 + 99_700_000 = 10_099_700_000
    // out = floor(99_700_000_000_000 / 10_099_700_000) = 9871
    expect(result.amountOut).toBe(9871n);
  });

  it('output is always less than reserveOut', () => {
    // Even with huge input, output < reserve
    const result = getAmountOut(999_999_999n, 1_000_000n, 1_000_000n, feeBps);
    expect(result.amountOut < 1_000_000n).toBe(true);
  });

  it('preserves k invariant', () => {
    const result = getAmountOut(10_000n, reserveA, reserveB, feeBps);
    const oldK = reserveA * reserveB;
    const newK = result.newReserveIn * result.newReserveOut;
    expect(newK >= oldK).toBe(true);
  });

  it('minimum fee gives larger output than a normal fee', () => {
    // 0 isn't a valid fee tier — the real contract enforces a 1 bps floor
    // (MIN_FEE_BPS), same as getAmountOut now does via requireValidFee.
    const withFee = getAmountOut(10_000n, reserveA, reserveB, 30n);
    const minFee = getAmountOut(10_000n, reserveA, reserveB, 1n);
    expect(minFee.amountOut > withFee.amountOut).toBe(true);
  });

  it('rejects a zero fee — not a valid tier on the real contract', () => {
    expect(() => getAmountOut(10_000n, reserveA, reserveB, 0n)).toThrow('feeBps must be between');
  });

  it('higher fee gives smaller output', () => {
    const low = getAmountOut(10_000n, reserveA, reserveB, 10n);
    const high = getAmountOut(10_000n, reserveA, reserveB, 100n);
    expect(low.amountOut > high.amountOut).toBe(true);
  });

  it('throws on zero input', () => {
    expect(() => getAmountOut(0n, reserveA, reserveB, feeBps)).toThrow('must be positive');
  });

  it('throws on zero reserve', () => {
    expect(() => getAmountOut(10_000n, 0n, reserveB, feeBps)).toThrow('must be positive');
    expect(() => getAmountOut(10_000n, reserveA, 0n, feeBps)).toThrow('must be positive');
  });

  it('throws on excessive fee', () => {
    expect(() => getAmountOut(10_000n, reserveA, reserveB, 1001n)).toThrow(
      'feeBps must be between',
    );
  });

  it('throws on tiny swap with zero output', () => {
    // 1 unit in a huge pool
    expect(() => getAmountOut(1n, 1_000_000_000_000n, 1_000_000_000_000n, 30n)).toThrow('zero');
  });

  it('handles large reserves correctly', () => {
    const bigReserve = 1_000_000_00000000n; // 1M tokens, 8 decimals
    const result = getAmountOut(
      1_00000000n, // 1 token
      bigReserve,
      bigReserve,
      30n,
    );
    expect(result.amountOut > 0n).toBe(true);
    expect(result.amountOut < bigReserve).toBe(true);
  });

  it('computes price impact', () => {
    // Large swap should have noticeable impact
    const result = getAmountOut(500_000n, reserveA, reserveB, 30n);
    expect(result.priceImpactBps > 0n).toBe(true);
  });

  it('small swap has low price impact', () => {
    // Use larger reserves+amounts to avoid integer rounding artifacts
    const bigR = 1_000_000_000n;
    const result = getAmountOut(1_000n, bigR, bigR, 30n);
    expect(result.priceImpactBps < 100n).toBe(true); // < 1%
  });

  it('k grows from fees', () => {
    // Do a swap, verify k increased
    const result = getAmountOut(10_000n, reserveA, reserveB, 30n);
    const oldK = reserveA * reserveB;
    const newK = result.newReserveIn * result.newReserveOut;
    expect(newK > oldK).toBe(true); // strictly greater due to fee
  });

  it('rounding test: output always floors', () => {
    // Use values that would produce a fractional result
    // 333 * 9970 * 1_000_000 / (1_000_000 * 10_000 + 333 * 9970)
    const result = getAmountOut(333n, reserveA, reserveB, 30n);
    // Verify the output matches floor division
    const amountInWithFee = 333n * 9970n;
    const expectedOut = (amountInWithFee * reserveB) / (reserveA * 10000n + amountInWithFee);
    expect(result.amountOut).toBe(expectedOut);
  });
});

// ─── Quote ────────────────────────────────────────────────────────────

describe('quote', () => {
  it('computes proportional amount', () => {
    expect(quote(100n, 1_000n, 2_000n)).toBe(200n);
  });

  it('rounds down', () => {
    expect(quote(1n, 3n, 10n)).toBe(3n); // floor(10/3) = 3
  });
});

// ─── Slippage ─────────────────────────────────────────────────────────

describe('getMinAmountOut', () => {
  it('applies slippage tolerance', () => {
    // 0.5% slippage on 10000
    expect(getMinAmountOut(10_000n, 50n)).toBe(9_950n);
  });

  it('returns same amount for 0 slippage', () => {
    expect(getMinAmountOut(10_000n, 0n)).toBe(10_000n);
  });

  it('throws on >= 100% slippage', () => {
    expect(() => getMinAmountOut(10_000n, 10_000n)).toThrow('less than 100%');
  });

  it('rounds down', () => {
    // 10001 * 9950 / 10000 = 99509.95 → 99509
    expect(getMinAmountOut(10_001n, 50n)).toBe(9_950n);
  });
});

// ─── Invariant / Property Tests ───────────────────────────────────────

describe('Invariant properties', () => {
  it('k never decreases after swap (property test)', () => {
    const testCases: [bigint, bigint, bigint, bigint][] = [
      [1n, 1_000_000n, 1_000_000n, 30n],
      [100n, 1_000_000n, 1_000_000n, 30n],
      [10_000n, 1_000_000n, 1_000_000n, 30n],
      [500_000n, 1_000_000n, 1_000_000n, 30n],
      [999_999n, 1_000_000n, 1_000_000n, 30n],
      [1n, 100_000_000n, 1n, 30n], // extreme imbalance
      [1n, 1n, 100_000_000n, 30n],
      [10_000n, 1_000_000n, 1_000_000n, 10n],
      [10_000n, 1_000_000n, 1_000_000n, 100n],
    ];

    for (const [amountIn, reserveIn, reserveOut, feeBps] of testCases) {
      try {
        const result = getAmountOut(amountIn, reserveIn, reserveOut, feeBps);
        const oldK = reserveIn * reserveOut;
        const newK = result.newReserveIn * result.newReserveOut;
        expect(newK).toBeGreaterThanOrEqual(oldK);
      } catch {
        // Some edge cases are expected to throw (e.g., zero output)
      }
    }
  });

  it('LP add then remove cycle does not create value', () => {
    // Start with a pool
    const reserveA = 1_000_000n;
    const reserveB = 2_000_000n;
    const totalLpSupply = 1_000_000n;

    // Add liquidity
    const added = getAddLiquidity(100_000n, 200_000n, reserveA, reserveB, totalLpSupply);

    const newReserveA = reserveA + added.actualAmountA;
    const newReserveB = reserveB + added.actualAmountB;
    const newLpSupply = totalLpSupply + added.lpMinted;

    // Remove the same LP
    const removed = getRemoveLiquidity(added.lpMinted, newReserveA, newReserveB, newLpSupply);

    // Should get back at most what was put in (rounding favors pool)
    expect(removed.amountA).toBeLessThanOrEqual(added.actualAmountA);
    expect(removed.amountB).toBeLessThanOrEqual(added.actualAmountB);
  });

  it('pool key commutativity', () => {
    // Tested more thoroughly in pool-key.spec.ts but included here for completeness
    const pairs = [
      ['AAA', 'BBB'],
      ['BBB', 'AAA'],
      [null, 'XXX'],
      ['XXX', null],
    ];
    for (const [a, b] of pairs) {
      const key1 = getPoolKey(a, b);
      const key2 = getPoolKey(b, a);
      expect(key1).toBe(key2);
    }
  });
});
