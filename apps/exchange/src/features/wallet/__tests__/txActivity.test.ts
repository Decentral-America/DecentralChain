/**
 * The activity feed's labelling.
 *
 * Every row used to read "Transaction" unless it was one of four types, which
 * meant a contract call, a burn, an issue and a mass transfer were all
 * indistinguishable in the feed — and carried no amount either.
 */
import { describe, expect, it } from 'vitest';
import { mapTxToActivity } from '@/features/wallet/txActivity';

const ME = '3PMyAddress';
const OTHER = '3PSomeoneElse';

const tx = (over: Record<string, unknown> = {}) => ({
  amount: 10_000_000_000,
  assetId: null,
  id: 'tx-1',
  recipient: OTHER,
  timestamp: Date.now(),
  type: 4,
  ...over,
});

describe('transfer direction', () => {
  it('reads as Sent when the recipient is someone else', () => {
    expect(mapTxToActivity(tx(), ME).verb).toBe('Sent');
  });

  it('reads as Received when the recipient is me', () => {
    const activity = mapTxToActivity(tx({ recipient: ME }), ME);

    expect(activity.verb).toBe('Received');
    expect(activity.isReceived).toBe(true);
  });
});

describe('transaction types', () => {
  it('names the types that used to fall through to "Transaction"', () => {
    // These four were the whole map. Everything else printed the literal word
    // "Transaction" — including every contract call the bridge and AMM make.
    const cases: [number, string][] = [
      [3, 'Issued'],
      [6, 'Burned'],
      [11, 'Mass transfer'],
      [12, 'Data written'],
      [16, 'Contract call'],
      [17, 'Asset updated'],
    ];

    for (const [type, expected] of cases) {
      expect(mapTxToActivity(tx({ type }), ME).verb).toBe(expected);
    }
  });

  it('still falls back for a type it does not know', () => {
    expect(mapTxToActivity(tx({ type: 99 }), ME).verb).toBe('Transaction');
  });
});

describe('amounts', () => {
  it('carries the raw amount for value-moving types', () => {
    // Raw, not scaled: the asset's own decimals are applied at render, where
    // they can actually be looked up. Dividing by 10^8 here was wrong by 100×
    // for any six-decimal token.
    expect(mapTxToActivity(tx({ amount: 12_345 }), ME).amountRaw).toBe(12_345);
    expect(mapTxToActivity(tx({ amount: 500, type: 6 }), ME).amountRaw).toBe(500);
    expect(mapTxToActivity(tx({ amount: 700, type: 8 }), ME).amountRaw).toBe(700);
  });

  it('reports no amount for types that do not move value', () => {
    // A data write or a script set has no amount. Rendering 0 would say it
    // moved nothing, rather than that the question does not apply.
    for (const type of [12, 13, 16]) {
      expect(mapTxToActivity(tx({ type }), ME).amountRaw).toBeNull();
    }
  });
});

describe('asset identity', () => {
  it('treats an empty assetId as native DCC', () => {
    expect(mapTxToActivity(tx({ assetId: '' }), ME).assetId).toBeNull();
  });

  it('keeps a real asset id', () => {
    const id = 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo';

    expect(mapTxToActivity(tx({ assetId: id }), ME).assetId).toBe(id);
  });
});
