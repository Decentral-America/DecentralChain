/**
 * Each network's config must resolve only that network's endpoints, so a build
 * selected with VITE_NETWORK can never reach another network's services.
 */
import { describe, expect, it } from 'vitest';
import mainnet from '../../configs/mainnet.json';
import stagenet from '../../configs/stagenet.json';
import testnet from '../../configs/testnet.json';

const configs = { mainnet, stagenet, testnet } as const;

describe('network config isolation', () => {
  for (const [name, config] of Object.entries(configs)) {
    it(`${name} config references no other network's hosts`, () => {
      const text = JSON.stringify(config).toLowerCase();
      for (const other of Object.keys(configs)) {
        if (other !== name) expect(text).not.toContain(other);
      }
    });
  }
});
