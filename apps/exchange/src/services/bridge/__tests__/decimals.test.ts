import { describe, expect, it } from 'vitest';
import {
  dccToSolana,
  hasDecimalGap,
  humanToRaw,
  rawToHuman,
  solanaToDcc,
} from '@/services/bridge/decimals';
import { type BridgeToken } from '@/services/bridge/types';

/** Live values from GET /tokens, 29 August 2026. */
const SOL: BridgeToken = {
  assetId: 'GnP6PSpZaKW4rSrPuNL1YhtQGDrH2dQR7vqCkKRTFvbf',
  dccDecimals: 8,
  divisor: 10,
  enabled: true,
  name: 'SOL',
  solDecimals: 9,
  splMint: 'So11111111111111111111111111111111111111112',
  totalBurned: '0',
  totalMinted: '0',
};

const USDC: BridgeToken = {
  ...SOL,
  dccDecimals: 6,
  divisor: 1,
  name: 'USDC',
  solDecimals: 6,
  splMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

describe('humanToRaw', () => {
  it('scales by the asset decimals', () => {
    expect(humanToRaw('1', 9)).toBe(1_000_000_000n);
    expect(humanToRaw('1.5', 9)).toBe(1_500_000_000n);
    expect(humanToRaw('0.001001', 9)).toBe(1_001_000n); // the live SOL minimum
    expect(humanToRaw('1', 6)).toBe(1_000_000n);
  });

  it('handles a bare fraction and a bare integer', () => {
    expect(humanToRaw('.5', 2)).toBe(50n);
    expect(humanToRaw('7', 0)).toBe(7n);
  });

  it('refuses to round away precision the asset cannot hold', () => {
    // Rounding here loses the user's money without telling them.
    expect(() => humanToRaw('1.123456789', 8)).toThrow(/decimal places/);
  });

  it('rejects anything that is not a plain non-negative decimal', () => {
    for (const bad of ['', '-1', '1e9', 'abc', '1.2.3', '1,5']) {
      expect(() => humanToRaw(bad, 8)).toThrow();
    }
  });
});

describe('rawToHuman', () => {
  it('is the inverse of humanToRaw', () => {
    for (const [human, decimals] of [
      ['1', 9],
      ['1.5', 9],
      ['0.001001', 9],
      ['123.456', 6],
    ] as const) {
      expect(rawToHuman(humanToRaw(human, decimals), decimals)).toBe(human);
    }
  });

  it('trims trailing zeros but keeps significant ones', () => {
    expect(rawToHuman(1_500_000_000n, 9)).toBe('1.5');
    expect(rawToHuman(1_000_000_000n, 9)).toBe('1');
    expect(rawToHuman(1_001_000n, 9)).toBe('0.001001');
  });

  it('pads sub-unit amounts correctly', () => {
    expect(rawToHuman(1n, 9)).toBe('0.000000001');
    expect(rawToHuman(0n, 9)).toBe('0');
  });

  it('accepts the string form the API returns', () => {
    expect(rawToHuman('2247722906', 9)).toBe('2.247722906');
  });
});

describe('solanaToDcc', () => {
  it('divides by the asset divisor for the 9→8 assets', () => {
    // 1 SOL = 1e9 raw on Solana, 1e8 raw wrapped. Treating them as equal
    // displays a balance 10× wrong.
    const result = solanaToDcc(1_000_000_000n, SOL);

    expect(result.dccRaw).toBe(100_000_000n);
    expect(result.dustRaw).toBe(0n);
    expect(rawToHuman(result.dccRaw, SOL.dccDecimals)).toBe('1');
  });

  it('reports the ninth decimal as dust rather than dropping it silently', () => {
    // 1.123456789 SOL carries one more decimal than the wrapped asset holds.
    // The remainder is truncated on chain and never refunded — the user is
    // entitled to know before they sign, not after.
    const result = solanaToDcc(1_123_456_789n, SOL);

    expect(result.dccRaw).toBe(112_345_678n);
    expect(result.dustRaw).toBe(9n);
    expect(rawToHuman(result.dccRaw, SOL.dccDecimals)).toBe('1.12345678');
  });

  it('is lossless for every 1:1 asset', () => {
    const result = solanaToDcc(123_456_789n, USDC);

    expect(result.dccRaw).toBe(123_456_789n);
    expect(result.dustRaw).toBe(0n);
  });
});

describe('dccToSolana', () => {
  it('multiplies back, which cannot lose precision', () => {
    expect(dccToSolana(100_000_000n, SOL)).toBe(1_000_000_000n);
    expect(dccToSolana(123_456_789n, USDC)).toBe(123_456_789n);
  });

  it('round-trips any amount that had no dust', () => {
    const { dccRaw, dustRaw } = solanaToDcc(2_500_000_000n, SOL);

    expect(dustRaw).toBe(0n);
    expect(dccToSolana(dccRaw, SOL)).toBe(2_500_000_000n);
  });
});

describe('hasDecimalGap', () => {
  it('is true only for the assets whose representations differ', () => {
    expect(hasDecimalGap(SOL)).toBe(true);
    expect(hasDecimalGap({ ...SOL, name: 'JitoSOL' })).toBe(true);
    expect(hasDecimalGap(USDC)).toBe(false);
  });
});
