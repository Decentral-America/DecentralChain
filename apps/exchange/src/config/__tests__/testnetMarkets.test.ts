/**
 * The testnet build lists the matcher's live markets instead of a hardcoded
 * pair. The previous hardcoded asset (C84Qs2…) was wiped by a chain re-genesis
 * and left the DEX opening on a pair that did not exist.
 */
import { describe, expect, it } from 'vitest';
import mainnet from '../../configs/mainnet.json';
import stagenet from '../../configs/stagenet.json';
import testnet from '../../configs/testnet.json';

describe('network market configuration', () => {
  it('testnet reads markets from the matcher and hardcodes no asset id', () => {
    expect(testnet.marketSource).toBe('matcher');
    expect(testnet.tradingPairs).toEqual([]);
    expect(testnet.hiddenMarketAssetNames).toEqual(['E2ETestTkn', 'DEXPROOF']);
  });

  it('mainnet and stagenet keep their curated config lists', () => {
    expect(mainnet.marketSource).toBe('config');
    expect(stagenet.marketSource).toBe('config');
    expect(mainnet.hiddenMarketAssetNames).toEqual([]);
    expect(stagenet.hiddenMarketAssetNames).toEqual([]);
  });
});
