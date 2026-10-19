// @vitest-environment node
import { libs } from '@decentralchain/transactions';
import { describe, expect, it, vi } from 'vitest';

const { logWarn } = vi.hoisted(() => ({ logWarn: vi.fn() }));
vi.mock('@/lib/error-logger', () => ({ logWarn }));

const { faucetAddress, faucetChainId, faucetSettings } = await import('./faucet-config');

describe('faucet config', () => {
  it('derives the faucet address for the configured network', () => {
    const env = { DCC_CHAIN_ID: '33', DCC_FAUCET_SEED: 'unit test faucet seed' };
    const address = faucetAddress(env);
    expect(address).toBe(libs.crypto.address('unit test faucet seed', 33));
    expect(address).toMatch(/^31[1-9A-HJ-NP-Za-km-z]{33}$/);
  });

  it('derives the address once per seed and network, not on every call', () => {
    const derive = vi.spyOn(libs.crypto, 'address');
    try {
      const env = { DCC_CHAIN_ID: '33', DCC_FAUCET_SEED: 'memo seed' };
      const first = faucetAddress(env);
      expect(faucetAddress(env)).toBe(first);
      expect(faucetAddress({ ...env })).toBe(first);
      expect(derive).toHaveBeenCalledTimes(1);

      // A different network or seed derives again.
      expect(faucetAddress({ ...env, DCC_CHAIN_ID: '63' })).not.toBe(first);
      expect(faucetAddress({ ...env, DCC_FAUCET_SEED: 'other seed' })).not.toBe(first);
      expect(derive).toHaveBeenCalledTimes(3);
    } finally {
      derive.mockRestore();
    }
  });

  it('is null when the faucet is not configured', () => {
    expect(faucetAddress({ DCC_CHAIN_ID: '33' })).toBeNull();
    expect(faucetAddress({ DCC_FAUCET_SEED: 'x' })).toBeNull();
    expect(faucetChainId({ DCC_CHAIN_ID: 'abc' })).toBeNull();
  });

  it('parses DCC_CHAIN_ID strictly: digits only, one network byte', () => {
    expect(faucetChainId({ DCC_CHAIN_ID: '33' })).toBe(33);
    expect(faucetChainId({ DCC_CHAIN_ID: ' 63 ' })).toBe(63);
    for (const bad of ['33abc', '3.3', '-1', '0x21', '1e1', '256', '', '  ']) {
      expect(faucetChainId({ DCC_CHAIN_ID: bad }), bad).toBeNull();
    }
    expect(faucetAddress({ DCC_CHAIN_ID: '33abc', DCC_FAUCET_SEED: 'x' })).toBeNull();
  });
});

describe('faucet settings', () => {
  it('defaults to 10 DCC every 24 hours, silently when unset or empty', () => {
    logWarn.mockClear();
    expect(faucetSettings({})).toEqual({ amountDcc: 10, rateHours: 24 });
    expect(faucetSettings({ DCC_FAUCET_AMOUNT: '', DCC_FAUCET_RATE_HOURS: ' ' })).toEqual({
      amountDcc: 10,
      rateHours: 24,
    });
    expect(logWarn).not.toHaveBeenCalled();
  });

  it('uses valid configured values', () => {
    expect(faucetSettings({ DCC_FAUCET_AMOUNT: '2.5', DCC_FAUCET_RATE_HOURS: '1' })).toEqual({
      amountDcc: 2.5,
      rateHours: 1,
    });
  });

  it.each([['0'], ['-5'], ['abc'], ['NaN'], ['Infinity']])(
    'falls back to the default with a warning for %j',
    (raw) => {
      logWarn.mockClear();
      expect(faucetSettings({ DCC_FAUCET_AMOUNT: raw, DCC_FAUCET_RATE_HOURS: raw })).toEqual({
        amountDcc: 10,
        rateHours: 24,
      });
      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining('DCC_FAUCET_AMOUNT'),
        expect.anything(),
      );
      expect(logWarn).toHaveBeenCalledWith(
        expect.stringContaining('DCC_FAUCET_RATE_HOURS'),
        expect.anything(),
      );
    },
  );
});
