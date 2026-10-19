import { describe, expect, it } from 'vitest';
import { DEFAULT_MAIN_CONFIG } from './constants';

describe('DEFAULT_MAIN_CONFIG.whitelist', () => {
  it('auto-permits only DecentralChain hosts that exist, including the testnet exchange', () => {
    expect(DEFAULT_MAIN_CONFIG.whitelist).toEqual([
      'decentralchain.io',
      'decentral.exchange',
      'testnet.decentral.exchange',
    ]);
  });

  it('grants nothing to hosts that do not resolve (anyone could later register them)', () => {
    for (const dead of [
      'explorer.decentralchain.io',
      'testnet.decentralchain.io',
      'stagenet.decentralchain.io',
    ]) {
      expect(DEFAULT_MAIN_CONFIG.whitelist).not.toContain(dead);
    }
  });
});
