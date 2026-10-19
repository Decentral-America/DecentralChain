// @vitest-environment node
import { libs } from '@decentralchain/transactions';
import { describe, expect, it } from 'vitest';
import { faucetAddress, faucetChainId } from './faucet-config';

describe('faucet config', () => {
  it('derives the faucet address for the configured network', () => {
    const env = { DCC_CHAIN_ID: '33', DCC_FAUCET_SEED: 'unit test faucet seed' };
    const address = faucetAddress(env);
    expect(address).toBe(libs.crypto.address('unit test faucet seed', 33));
    expect(address).toMatch(/^31[1-9A-HJ-NP-Za-km-z]{33}$/);
  });

  it('is null when the faucet is not configured', () => {
    expect(faucetAddress({ DCC_CHAIN_ID: '33' })).toBeNull();
    expect(faucetAddress({ DCC_FAUCET_SEED: 'x' })).toBeNull();
    expect(faucetChainId({ DCC_CHAIN_ID: 'abc' })).toBeNull();
  });
});
