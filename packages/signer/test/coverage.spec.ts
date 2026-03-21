/**
 * Targeted coverage tests for signer internal modules.
 *
 * Exercises paths not reached by the transaction integration specs:
 *  - validateSignerOptions / validateProviderInterface error branches
 *  - All SignerError subclass constructors
 *  - Decorator error paths (ensureProvider, checkAuth, catchProviderError)
 *  - errorHandlerFactory (helpers.ts)
 *  - logger levels (logger.ts)
 */

import { TRANSACTION_TYPE } from '@decentralchain/ts-types';
import { describe, expect, it, vi } from 'vitest';
import { makeConsole, makeOptions } from '../src/logger';
import Signer from '../src/Signer';
import {
  ERRORS,
  SignerApiArgumentsError,
  SignerAuthError,
  SignerEnsureProviderError,
  SignerNetworkByteError,
  SignerNetworkError,
  SignerOptionsError,
  SignerProviderConnectError,
  SignerProviderInterfaceError,
  SignerProviderInternalError,
  SignerProviderSignIsNotSupport,
} from '../src/SignerError';
import {
  argsValidators,
  validateProviderInterface,
  validateSignerOptions,
} from '../src/validation';
import { MOCK_URL } from './test-env';

// ---------------------------------------------------------------------------
// validateSignerOptions
// ---------------------------------------------------------------------------

describe('validateSignerOptions', () => {
  it('valid https URL passes', () => {
    const result = validateSignerOptions({ NODE_URL: 'https://node.decentralchain.io' });
    expect(result.isValid).toBe(true);
    expect(result.invalidOptions).toHaveLength(0);
  });

  it('valid http URL passes', () => {
    const result = validateSignerOptions({ NODE_URL: 'http://localhost:6869' });
    expect(result.isValid).toBe(true);
    expect(result.invalidOptions).toHaveLength(0);
  });

  it('missing NODE_URL fails', () => {
    const result = validateSignerOptions({});
    expect(result.isValid).toBe(false);
    expect(result.invalidOptions).toContain('NODE_URL');
  });

  it('non-string NODE_URL fails', () => {
    const result = validateSignerOptions({ NODE_URL: 123 as unknown as string });
    expect(result.isValid).toBe(false);
    expect(result.invalidOptions).toContain('NODE_URL');
  });

  it('invalid URL string fails', () => {
    const result = validateSignerOptions({ NODE_URL: 'not a url' });
    expect(result.isValid).toBe(false);
    expect(result.invalidOptions).toContain('NODE_URL');
  });

  it('unsupported protocol (ftp://) fails', () => {
    const result = validateSignerOptions({ NODE_URL: 'ftp://example.com' });
    expect(result.isValid).toBe(false);
    expect(result.invalidOptions).toContain('NODE_URL');
  });

  it('valid LOG_LEVEL passes', () => {
    for (const level of ['verbose', 'production', 'error']) {
      const result = validateSignerOptions({ LOG_LEVEL: level as 'verbose', NODE_URL: MOCK_URL });
      expect(result.isValid).toBe(true);
    }
  });

  it('invalid LOG_LEVEL fails', () => {
    const result = validateSignerOptions({
      LOG_LEVEL: 'debug' as unknown as 'verbose',
      NODE_URL: MOCK_URL,
    });
    expect(result.isValid).toBe(false);
    expect(result.invalidOptions).toContain('LOG_LEVEL');
  });

  it('absent LOG_LEVEL (optional) passes', () => {
    const result = validateSignerOptions({ NODE_URL: MOCK_URL });
    expect(result.isValid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateProviderInterface
// ---------------------------------------------------------------------------

const completeProvider = {
  connect: () => {},
  login: () => {},
  logout: () => {},
  sign: () => {},
  signMessage: () => {},
  signTypedData: () => {},
};

describe('validateProviderInterface', () => {
  it('complete provider passes', () => {
    const result = validateProviderInterface(completeProvider);
    expect(result.isValid).toBe(true);
    expect(result.invalidProperties).toHaveLength(0);
  });

  it('missing one method fails', () => {
    const { connect: _omit, ...partial } = completeProvider;
    const result = validateProviderInterface(partial);
    expect(result.isValid).toBe(false);
    expect(result.invalidProperties).toContain('connect');
  });

  it('non-function value fails', () => {
    const result = validateProviderInterface({ ...completeProvider, sign: 'not-a-function' });
    expect(result.isValid).toBe(false);
    expect(result.invalidProperties).toContain('sign');
  });

  it('multiple invalid properties are all reported', () => {
    const result = validateProviderInterface({ connect: () => {}, login: null });
    expect(result.isValid).toBe(false);
    expect(result.invalidProperties.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// SignerError subclass constructors
// ---------------------------------------------------------------------------

describe('SignerError subclasses', () => {
  it('SignerOptionsError carries code and message', () => {
    const err = new SignerOptionsError(['NODE_URL']);
    expect(err.code).toBe(ERRORS.SIGNER_OPTIONS);
    expect(err.message).toContain('NODE_URL');
    expect(err instanceof SignerOptionsError).toBe(true);
  });

  it('SignerApiArgumentsError carries code and details', () => {
    const err = new SignerApiArgumentsError(['amount must be positive']);
    expect(err.code).toBe(ERRORS.API_ARGUMENTS);
    expect(err.message).toContain('amount must be positive');
  });

  it('SignerNetworkByteError carries node URL', () => {
    const err = new SignerNetworkByteError({ error: 'timeout', node: 'https://node.example.com' });
    expect(err.code).toBe(ERRORS.NETWORK_BYTE);
    expect(err.message).toContain('node.example.com');
  });

  it('SignerProviderInterfaceError lists invalid properties', () => {
    const err = new SignerProviderInterfaceError(['login', 'logout']);
    expect(err.code).toBe(ERRORS.PROVIDER_INTERFACE);
    expect(err.message).toContain('login');
  });

  it('SignerProviderConnectError is a SignerError', () => {
    const err = new SignerProviderConnectError({ error: 'refused', node: 'https://n.io' });
    expect(err.code).toBe(ERRORS.PROVIDER_CONNECT);
    expect(err.type).toBe('network');
  });

  it('SignerProviderSignIsNotSupport is a SignerError', () => {
    const err = new SignerProviderSignIsNotSupport({ error: 'n/a', node: 'https://n.io' });
    expect(err.code).toBe(ERRORS.PROVIDER_SIGN_NOT_SUPPORTED);
  });

  it('SignerEnsureProviderError names the failed method', () => {
    const err = new SignerEnsureProviderError('login');
    expect(err.code).toBe(ERRORS.ENSURE_PROVIDER);
    expect(err.message).toContain('login');
  });

  it('SignerProviderInternalError wraps provider message', () => {
    const err = new SignerProviderInternalError('upstream failure');
    expect(err.code).toBe(ERRORS.PROVIDER_INTERNAL);
    expect(err.message).toContain('upstream failure');
  });

  it('SignerAuthError names the failed method', () => {
    const err = new SignerAuthError('transfer');
    expect(err.code).toBe(ERRORS.NOT_AUTHORIZED);
    expect(err.message).toContain('transfer');
  });

  it('SignerNetworkError sets type to network', () => {
    const err = new SignerNetworkError({ url: 'https://bad.io' });
    expect(err.code).toBe(ERRORS.NETWORK_ERROR);
    expect(err.type).toBe('network');
  });
});

// ---------------------------------------------------------------------------
// Decorator error paths
// ---------------------------------------------------------------------------

describe('Signer decorators', () => {
  it('ensureProvider: calling on() without a provider throws SignerEnsureProviderError', () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    // No setProvider call — currentProvider is null
    expect(() => signer.on('connect', vi.fn())).toThrow();
    try {
      signer.on('connect', vi.fn());
    } catch (err) {
      expect(err).toBeInstanceOf(SignerEnsureProviderError);
    }
  });

  it('ensureProvider: calling once() without a provider throws', () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    expect(() => signer.once('connect', vi.fn())).toThrow();
  });

  it('checkAuth: calling getBalance() before login throws synchronously', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    // A provider with user=null triggers the checkAuth guard (user == null)
    const mockProvider = {
      ...completeProvider,
      // connect must return a Promise; the guard fires before the network call
      connect: vi.fn().mockResolvedValue(undefined),
      off: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      once: vi.fn().mockReturnThis(),
      user: null,
    };
    await signer.setProvider(mockProvider as unknown as Parameters<typeof signer.setProvider>[0]);

    // checkAuth throws synchronously before returning the Promise
    expect(() => signer.getBalance()).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Signer constructor — invalid options
// ---------------------------------------------------------------------------

describe('Signer constructor validation', () => {
  it('throws SignerOptionsError when NODE_URL is an empty string', () => {
    // Explicitly overrides the default NODE_URL with an invalid value
    expect(() => new Signer({ NODE_URL: '' })).toThrow(SignerOptionsError);
  });

  it('throws SignerOptionsError when NODE_URL has invalid protocol', () => {
    expect(() => new Signer({ NODE_URL: 'ftp://x.com' })).toThrow(SignerOptionsError);
  });

  it('throws SignerOptionsError when NODE_URL is not a valid URL', () => {
    expect(() => new Signer({ NODE_URL: 'not a url at all' })).toThrow(SignerOptionsError);
  });

  it('does not throw with a valid https NODE_URL', () => {
    expect(() => new Signer({ NODE_URL: MOCK_URL })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// logger.ts — makeOptions and makeConsole all log levels
// ---------------------------------------------------------------------------

describe('logger - makeOptions', () => {
  it('preserves valid levels', () => {
    expect(makeOptions('verbose', 'X').level).toBe('verbose');
    expect(makeOptions('production', 'X').level).toBe('production');
    expect(makeOptions('error', 'X').level).toBe('error');
  });

  it('falls back to production for unknown level', () => {
    expect(makeOptions('unknown', 'X').level).toBe('production');
    expect(makeOptions('', 'X').level).toBe('production');
  });
});

describe('logger - makeConsole levels', () => {
  it('error level: info/log/warn are no-ops, error works', () => {
    const logger = makeConsole(makeOptions('error', 'T'));
    expect(() => logger.info('x')).not.toThrow();
    expect(() => logger.log('x')).not.toThrow();
    expect(() => logger.warn('x')).not.toThrow();
    expect(() => logger.error('x')).not.toThrow();
  });

  it('production level: warn active, info/log are no-ops', () => {
    const logger = makeConsole(makeOptions('production', 'T'));
    expect(() => logger.warn('msg')).not.toThrow();
    expect(() => logger.info('x')).not.toThrow();
    expect(() => logger.log('x')).not.toThrow();
    expect(() => logger.error('x')).not.toThrow();
  });

  it('verbose level: all methods active', () => {
    const logger = makeConsole(makeOptions('verbose', 'T'));
    expect(() => logger.info('v')).not.toThrow();
    expect(() => logger.log('v')).not.toThrow();
    expect(() => logger.warn('v')).not.toThrow();
    expect(() => logger.error('v')).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// argsValidators — exercise internal validation helpers via public validators
// ---------------------------------------------------------------------------

describe('argsValidators - transfer', () => {
  it('valid transfer passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(true);
  });

  it('invalid recipient fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 'bad!!!recipient@@',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('recipient');
  });

  it('negative amount fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: -1,
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('amount');
  });

  it('missing amount fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('amount');
  });

  it('empty assetId (DCC native) passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      assetId: '',
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(true);
  });

  it('assetId DCC passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      assetId: 'DCC',
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(true);
  });
});

describe('argsValidators - issue', () => {
  it('valid issue passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.ISSUE]({
      decimals: 8,
      name: 'MyToken',
      quantity: 1000000,
      type: TRANSACTION_TYPE.ISSUE,
    });
    expect(r.isValid).toBe(true);
  });

  it('name too short fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.ISSUE]({
      decimals: 8,
      name: 'AB', // min is 4
      quantity: 1000000,
      type: TRANSACTION_TYPE.ISSUE,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('name');
  });

  it('name too long fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.ISSUE]({
      decimals: 8,
      name: 'A'.repeat(17), // max is 16
      quantity: 1000000,
      type: TRANSACTION_TYPE.ISSUE,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('name');
  });

  it('negative quantity fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.ISSUE]({
      decimals: 8,
      name: 'MyToken',
      quantity: -1,
      type: TRANSACTION_TYPE.ISSUE,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('quantity');
  });

  it('base64 script passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.ISSUE]({
      decimals: 0,
      name: 'ScriptedToken',
      quantity: 1000,
      script: 'base64:BAbMtW/U',
      type: TRANSACTION_TYPE.ISSUE,
    });
    expect(r.isValid).toBe(true);
  });

  it('invalid script format fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.ISSUE]({
      decimals: 0,
      name: 'MyToken',
      quantity: 1000,
      script: 'not-base64-format',
      type: TRANSACTION_TYPE.ISSUE,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('script');
  });
});

describe('argsValidators - data', () => {
  it('valid data tx with string/integer/boolean fields passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.DATA]({
      data: [
        { key: 'str', type: 'string', value: 'hello' },
        { key: 'int', type: 'integer', value: 42 },
        { key: 'bool', type: 'boolean', value: true },
      ],
      type: TRANSACTION_TYPE.DATA,
    });
    expect(r.isValid).toBe(true);
  });

  it('null key on data item fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.DATA]({
      data: [{ key: null, type: 'string', value: 'x' }],
      type: TRANSACTION_TYPE.DATA,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('data');
  });

  it('invalid type in data item fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.DATA]({
      data: [{ key: 'k', type: 'unknown', value: 'x' }],
      type: TRANSACTION_TYPE.DATA,
    });
    expect(r.isValid).toBe(false);
  });
});

describe('argsValidators - set script', () => {
  it('null script passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.SET_SCRIPT]({
      script: null,
      type: TRANSACTION_TYPE.SET_SCRIPT,
    });
    expect(r.isValid).toBe(true);
  });

  it('valid base64 script passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.SET_SCRIPT]({
      script: 'base64:BAbMtW/U',
      type: TRANSACTION_TYPE.SET_SCRIPT,
    });
    expect(r.isValid).toBe(true);
  });

  it('invalid script fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.SET_SCRIPT]({
      script: 'no-base64-prefix',
      type: TRANSACTION_TYPE.SET_SCRIPT,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('script');
  });
});

describe('argsValidators - lease', () => {
  it('valid lease passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.LEASE]({
      amount: 1000,
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.LEASE,
    });
    expect(r.isValid).toBe(true);
  });

  it('zero amount fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.LEASE]({
      amount: 0,
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.LEASE,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('amount');
  });
});

describe('argsValidators - invoke', () => {
  it('minimal invoke (no call) passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.INVOKE_SCRIPT]({
      dApp: 'alias:D:contract',
      type: TRANSACTION_TYPE.INVOKE_SCRIPT,
    });
    expect(r.isValid).toBe(true);
  });

  it('invoke with call and args passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.INVOKE_SCRIPT]({
      call: { args: [], function: 'someFunction' },
      dApp: 'alias:D:contract',
      type: TRANSACTION_TYPE.INVOKE_SCRIPT,
    });
    expect(r.isValid).toBe(true);
  });

  it('invalid dApp recipient fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.INVOKE_SCRIPT]({
      dApp: 'not-a-valid-address-or-alias',
      type: TRANSACTION_TYPE.INVOKE_SCRIPT,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('dApp');
  });
});

describe('argsValidators - cancel lease', () => {
  it('valid cancel lease passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.CANCEL_LEASE]({
      leaseId: 'someleaseId123',
      type: TRANSACTION_TYPE.CANCEL_LEASE,
    });
    expect(r.isValid).toBe(true);
  });
});

describe('argsValidators - alias', () => {
  it('valid alias name passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.ALIAS]({
      alias: 'myalias',
      type: TRANSACTION_TYPE.ALIAS,
    });
    expect(r.isValid).toBe(true);
  });

  it('alias name too short fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.ALIAS]({
      alias: 'ab', // min is 4
      type: TRANSACTION_TYPE.ALIAS,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('alias');
  });
});

describe('argsValidators - reissue', () => {
  it('valid reissue passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.REISSUE]({
      assetId: 'DCC',
      quantity: 1000,
      reissuable: true,
      type: TRANSACTION_TYPE.REISSUE,
    });
    expect(r.isValid).toBe(true);
  });
});

describe('argsValidators - burn', () => {
  it('valid burn passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.BURN]({
      amount: 100,
      assetId: 'someasset',
      type: TRANSACTION_TYPE.BURN,
    });
    expect(r.isValid).toBe(true);
  });
});

describe('argsValidators - sponsorship', () => {
  it('null minSponsoredAssetFee passes (disable sponsorship)', () => {
    const r = argsValidators[TRANSACTION_TYPE.SPONSORSHIP]({
      assetId: 'someasset',
      minSponsoredAssetFee: null,
      type: TRANSACTION_TYPE.SPONSORSHIP,
    });
    expect(r.isValid).toBe(true);
  });

  it('positive minSponsoredAssetFee passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.SPONSORSHIP]({
      assetId: 'someasset',
      minSponsoredAssetFee: 100,
      type: TRANSACTION_TYPE.SPONSORSHIP,
    });
    expect(r.isValid).toBe(true);
  });
});

describe('argsValidators - mass transfer', () => {
  it('valid mass transfer passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.MASS_TRANSFER]({
      transfers: [{ amount: 100, recipient: 'alias:D:test' }],
      type: TRANSACTION_TYPE.MASS_TRANSFER,
    });
    expect(r.isValid).toBe(true);
  });

  it('empty transfers fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.MASS_TRANSFER]({
      transfers: [],
      type: TRANSACTION_TYPE.MASS_TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('transfers');
  });
});

// ---------------------------------------------------------------------------
// Signer._sign branches — invalid args and isSignAndBroadcastByProvider
// ---------------------------------------------------------------------------

const makeMockProvider = (signImpl?: () => Promise<unknown>) => ({
  connect: vi.fn().mockResolvedValue(undefined),
  login: vi
    .fn()
    .mockResolvedValue({ address: '3NBvmBE48DGGLqPmBHv9vWVGqfvNdSbMFyg', publicKey: 'testPubKey' }),
  logout: vi.fn().mockResolvedValue(undefined),
  off: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  once: vi.fn().mockReturnThis(),
  sign: vi.fn().mockImplementation(signImpl ?? (() => Promise.resolve([]))),
  signMessage: vi.fn().mockResolvedValue(''),
  signTypedData: vi.fn().mockResolvedValue(''),
});

describe('Signer._sign error branches', () => {
  it('invalid args throw SignerApiArgumentsError synchronously', () => {
    // No provider needed — validation fires before _connectPromise
    const signer = new Signer({ NODE_URL: MOCK_URL });
    expect(() => signer.transfer({ amount: -999, recipient: 'alias:D:test' }).sign()).toThrow(
      SignerApiArgumentsError,
    );
  });

  it('isSignAndBroadcastByProvider=true throws SignerProviderSignIsNotSupport', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const mockProvider = { ...makeMockProvider(), isSignAndBroadcastByProvider: true as const };
    await signer.setProvider(mockProvider as unknown as Parameters<typeof signer.setProvider>[0]);
    expect(() => signer.transfer({ amount: 1000, recipient: 'alias:D:test' }).sign()).toThrow(
      SignerProviderSignIsNotSupport,
    );
  });

  it('unknown transaction type fails validation', () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    expect(() =>
      (signer as unknown as { _sign: (txs: unknown[]) => unknown })._sign([
        { amount: 1, type: 9999 },
      ]),
    ).toThrow(SignerApiArgumentsError);
  });
});

// ---------------------------------------------------------------------------
// catchProviderError decorator — via provider.sign() rejection
// ---------------------------------------------------------------------------

describe('catchProviderError decorator branches', () => {
  it('user rejection string passes through unrewrapped', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const provider = makeMockProvider(() => Promise.reject('Error: User rejection!'));
    await signer.setProvider(provider as unknown as Parameters<typeof signer.setProvider>[0]);
    await expect(signer.transfer({ amount: 1000, recipient: 'alias:D:test' }).sign()).rejects.toBe(
      'Error: User rejection!',
    );
  });

  it('SignerError instance passes through unrewrapped', async () => {
    const original = new SignerAuthError('sign');
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const provider = makeMockProvider(() => Promise.reject(original));
    await signer.setProvider(provider as unknown as Parameters<typeof signer.setProvider>[0]);
    await expect(signer.transfer({ amount: 1000, recipient: 'alias:D:test' }).sign()).rejects.toBe(
      original,
    );
  });

  it('unknown error is logged and re-rejected as original', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const provider = makeMockProvider(() => Promise.reject(new Error('network failure')));
    await signer.setProvider(provider as unknown as Parameters<typeof signer.setProvider>[0]);
    await expect(
      signer.transfer({ amount: 1000, recipient: 'alias:D:test' }).sign(),
    ).rejects.toThrow('network failure');
  });

  it('non-Error rejection uses String() fallback in error message (decorators.ts line 55)', async () => {
    // Rejection with an object lacking .message triggers the `?? String(e)` branch
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const provider = makeMockProvider(() => Promise.reject({ code: 'ERR_CUSTOM' }));
    await signer.setProvider(provider as unknown as Parameters<typeof signer.setProvider>[0]);
    await expect(
      signer.transfer({ amount: 1000, recipient: 'alias:D:test' }).sign(),
    ).rejects.toEqual({ code: 'ERR_CUSTOM' });
  });
});

// ---------------------------------------------------------------------------
// Signer - login error paths (covers Signer.ts catch branches)
// ---------------------------------------------------------------------------

describe('Signer - login error paths', () => {
  it('user rejection propagates through unwrapped', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const mockProvider = {
      ...makeMockProvider(),
      login: vi.fn().mockRejectedValue('Error: User rejection!'),
    };
    await signer.setProvider(mockProvider as unknown as Parameters<typeof signer.setProvider>[0]);
    await expect(signer.login()).rejects.toBe('Error: User rejection!');
  });

  it('Error instance is wrapped in SignerProviderInternalError', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const mockProvider = {
      ...makeMockProvider(),
      login: vi.fn().mockRejectedValue(new Error('auth failed')),
    };
    await signer.setProvider(mockProvider as unknown as Parameters<typeof signer.setProvider>[0]);
    await expect(signer.login()).rejects.toBeInstanceOf(SignerProviderInternalError);
  });

  it('non-Error rejection uses String() fallback', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const mockProvider = {
      ...makeMockProvider(),
      login: vi.fn().mockRejectedValue('string-error'),
    };
    await signer.setProvider(mockProvider as unknown as Parameters<typeof signer.setProvider>[0]);
    await expect(signer.login()).rejects.toBeInstanceOf(SignerProviderInternalError);
  });
});

// ---------------------------------------------------------------------------
// Signer - logout error path
// ---------------------------------------------------------------------------

describe('Signer - logout error path', () => {
  it('logout error is wrapped in SignerProviderInternalError', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const mockProvider = {
      ...makeMockProvider(),
      logout: vi.fn().mockRejectedValue(new Error('logout failed')),
    };
    await signer.setProvider(mockProvider as unknown as Parameters<typeof signer.setProvider>[0]);
    await expect(signer.logout()).rejects.toBeInstanceOf(SignerProviderInternalError);
  });

  it('non-Error logout rejection uses String() fallback', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const mockProvider = { ...makeMockProvider(), logout: vi.fn().mockRejectedValue('logout-err') };
    await signer.setProvider(mockProvider as unknown as Parameters<typeof signer.setProvider>[0]);
    await expect(signer.logout()).rejects.toBeInstanceOf(SignerProviderInternalError);
  });
});

// ---------------------------------------------------------------------------
// Signer - setProvider with invalid provider interface
// ---------------------------------------------------------------------------

describe('Signer - setProvider invalid provider', () => {
  it('rejects when provider is missing required methods', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const badProvider = { connect: () => {}, login: () => {} }; // missing logout, sign, etc.
    await expect(
      signer.setProvider(badProvider as unknown as Parameters<typeof signer.setProvider>[0]),
    ).rejects.toBeInstanceOf(SignerProviderInterfaceError);
  });
});

// ---------------------------------------------------------------------------
// argsValidators - exchange (exercises orderValidator branches)
// ---------------------------------------------------------------------------

describe('argsValidators - exchange', () => {
  it('exchange with null orders fails (orderValidator catch → false)', () => {
    const r = argsValidators[TRANSACTION_TYPE.EXCHANGE]({
      amount: 1000,
      buyMatcherFee: 100,
      order1: null,
      order2: null,
      price: 500,
      sellMatcherFee: 100,
      type: TRANSACTION_TYPE.EXCHANGE,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('order1');
  });
});

// ---------------------------------------------------------------------------
// argsValidators - invoke with payment (exercises payment validator branches)
// ---------------------------------------------------------------------------

describe('argsValidators - invoke with payment', () => {
  it('invoke with valid payment passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.INVOKE_SCRIPT]({
      dApp: 'alias:D:contract',
      payment: [{ amount: 100, assetId: 'DCC' }],
      type: TRANSACTION_TYPE.INVOKE_SCRIPT,
    });
    expect(r.isValid).toBe(true);
  });

  it('invoke with invalid payment amount fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.INVOKE_SCRIPT]({
      dApp: 'alias:D:contract',
      payment: [{ amount: 0, assetId: 'DCC' }],
      type: TRANSACTION_TYPE.INVOKE_SCRIPT,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('payment');
  });

  it('invoke with empty payment array fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.INVOKE_SCRIPT]({
      dApp: 'alias:D:contract',
      payment: 'not-an-array',
      type: TRANSACTION_TYPE.INVOKE_SCRIPT,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('payment');
  });
});

// ---------------------------------------------------------------------------
// validation.ts — edge cases for isNonNegativeAmount, isValidAlias, isPublicKey
// ---------------------------------------------------------------------------

describe('validation edge cases - isNonNegativeAmount string overflow', () => {
  it('string amount longer than MAX_SAFE_LONG fails (str.length > 19)', () => {
    // 20-digit number exceeds MAX_SAFE_LONG length
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: '99999999999999999999', // 20 digits > MAX_SAFE_LONG (19 digits)
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('amount');
  });

  it('string amount same length as MAX_SAFE_LONG but larger fails', () => {
    // Same length as MAX_SAFE_LONG but one greater → string comparison fires
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: '9223372036854775808', // MAX_SAFE_LONG + 1
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('amount');
  });

  it('number > MAX_SAFE_INTEGER fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: Number.MAX_SAFE_INTEGER + 1,
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('amount');
  });
});

describe('validation edge cases - isValidAlias malformed aliases', () => {
  it('alias with too few parts fails (parts.length !== 3)', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 'alias:onlyTwoParts',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
  });

  it('alias with empty chainByte fails (!chainByte)', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 'alias::test', // empty chainByte
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
  });

  it('alias with multi-char chainByte fails (chainByte.length !== 1)', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 'alias:XX:test', // 2-char chainByte
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
  });

  it('alias with control char chainByte fails (charCode < 33)', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 'alias:\x01:test', // control char, charCode 1 < 33
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
  });

  it('alias with high-codepoint chainByte fails (charCode > 126)', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 'alias:\x9F:test', // charCode 159 > 126
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
  });
});

describe('validation edge cases - isPublicKey and isValidAddress', () => {
  it('transfer: non-string senderPublicKey fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 'alias:D:test',
      senderPublicKey: 12345 as unknown as string,
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('senderPublicKey');
  });

  it('transfer: invalid base58 senderPublicKey fails', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 'alias:D:test',
      senderPublicKey: 'not!valid!base58@@@',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('senderPublicKey');
  });

  it('transfer: non-string recipient fails (isRecipient !isString branch)', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: 42 as unknown as string,
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('recipient');
  });

  it('transfer: empty-string recipient fails (isValidAddress str.length === 0 branch)', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      recipient: '',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('recipient');
  });
});

describe('validation edge cases - isAssetId and isBase64', () => {
  it('assetId null passes (native token)', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 1000,
      assetId: null,
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(true);
  });

  it('issue: empty base64 content after prefix passes', () => {
    const r = argsValidators[TRANSACTION_TYPE.ISSUE]({
      decimals: 0,
      name: 'Token',
      quantity: 1000,
      script: 'base64:', // empty content after prefix
      type: TRANSACTION_TYPE.ISSUE,
    });
    expect(r.isValid).toBe(true);
  });

  it('isNonNegativeAmount with non-numeric string returns false', () => {
    const r = argsValidators[TRANSACTION_TYPE.TRANSFER]({
      amount: 'not-a-number',
      recipient: 'alias:D:test',
      type: TRANSACTION_TYPE.TRANSFER,
    });
    expect(r.isValid).toBe(false);
    expect(r.invalidFields).toContain('amount');
  });
});

// ---------------------------------------------------------------------------
// Signer - _createPipelineAPI broadcast paths
// ---------------------------------------------------------------------------

describe('Signer - _createPipelineAPI broadcast', () => {
  it('broadcast with isSignAndBroadcastByProvider=true calls provider.sign directly', async () => {
    const signer = new Signer({ NODE_URL: MOCK_URL });
    const signedTx = [{ id: 'broadcast-id', signed: true, type: 4 }];
    const mockProvider = {
      ...makeMockProvider(() => Promise.resolve(signedTx)),
      isSignAndBroadcastByProvider: true as const,
    };
    await signer.setProvider(mockProvider as unknown as Parameters<typeof signer.setProvider>[0]);
    const result = await signer.transfer({ amount: 1000, recipient: 'alias:D:test' }).broadcast();
    expect(result).toEqual(signedTx);
    expect(mockProvider.sign).toHaveBeenCalled();
  });
});
