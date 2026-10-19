import { describe, expect, it } from 'vitest';
import mainnet from '../../configs/mainnet.json';
import stagenet from '../../configs/stagenet.json';
import testnet from '../../configs/testnet.json';

describe('network configs', () => {
  it.each([
    ['mainnet', mainnet],
    ['stagenet', stagenet],
    ['testnet', testnet],
  ])('%s carries no unread "origin" URL', (_name, config) => {
    expect(config).not.toHaveProperty('origin');
  });
});
