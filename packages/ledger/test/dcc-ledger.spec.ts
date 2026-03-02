import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DCCLedger } from '../src/dcc-ledger.js';
import type { LedgerTransport, LedgerTransportFactory } from '../src/types.js';

/**
 * Build a Uint8Array Ledger response: payload + 2-byte status word.
 */
function ledgerResponse(payload: number[], status = [0x90, 0x00]): Uint8Array {
  return new Uint8Array([...payload, ...status]);
}

function createMockTransport(): LedgerTransport {
  return {
    send: vi.fn().mockResolvedValue(ledgerResponse([])),
    close: vi.fn().mockResolvedValue(undefined),
    setExchangeTimeout: vi.fn(),
    decorateAppAPIMethods: vi.fn(),
  };
}

function createMockFactory(transport?: LedgerTransport): LedgerTransportFactory {
  const t = transport ?? createMockTransport();
  return {
    create: vi.fn().mockResolvedValue(t),
  };
}

// Suppress console.warn from internal reconnect attempts
beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DCCLedger', () => {
  describe('constructor', () => {
    it('throws TypeError when transport is not provided', () => {
      expect(() => new DCCLedger({} as any)).toThrow(TypeError);
      expect(() => new DCCLedger({} as any)).toThrow('requires a transport factory');
    });

    it('creates instance with valid transport', () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      expect(ledger).toBeDefined();
      expect(ledger.ready).toBe(false);
    });

    it('accepts optional configuration', () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({
        transport: factory,
        debug: true,
        openTimeout: 1000,
        listenTimeout: 5000,
        exchangeTimeout: 10000,
        networkCode: 84,
      });
      expect(ledger).toBeDefined();
    });

    it('throws RangeError when networkCode exceeds uint8', () => {
      const factory = createMockFactory();
      expect(() => new DCCLedger({ transport: factory, networkCode: 256 })).toThrow(RangeError);
      expect(() => new DCCLedger({ transport: factory, networkCode: 256 })).toThrow(
        'networkCode must be an integer in [0, 255]',
      );
    });

    it('throws RangeError when networkCode is negative', () => {
      const factory = createMockFactory();
      expect(() => new DCCLedger({ transport: factory, networkCode: -1 })).toThrow(RangeError);
    });
  });

  describe('getPathById', () => {
    it('builds correct BIP-44 path for index 0', () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      expect(ledger.getPathById(0)).toBe("44'/5741564'/0'/0'/0'");
    });

    it('builds correct BIP-44 path for index 5', () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      expect(ledger.getPathById(5)).toBe("44'/5741564'/0'/0'/5'");
    });

    it('throws RangeError on negative account ID', () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      expect(() => ledger.getPathById(-1)).toThrow(RangeError);
      expect(() => ledger.getPathById(-1)).toThrow('non-negative integer');
    });

    it('throws RangeError on non-integer account ID', () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      expect(() => ledger.getPathById(1.5)).toThrow(RangeError);
      expect(() => ledger.getPathById(NaN)).toThrow(RangeError);
    });

    it('throws RangeError on ID exceeding BIP-44 range', () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      expect(() => ledger.getPathById(0x80000000)).toThrow(RangeError);
    });
  });

  describe('tryConnect', () => {
    it('calls transport factory create()', async () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      expect(factory.create).toHaveBeenCalled();
    });

    it('sets ready to true after successful connection', async () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      expect(ledger.ready).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('calls transport.close() on disconnect', async () => {
      const transport = createMockTransport();
      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      await ledger.disconnect();
      expect(transport.close).toHaveBeenCalled();
    });

    it('swallows errors from already-closed transport', async () => {
      const transport = createMockTransport();
      transport.close = vi.fn().mockRejectedValue(new Error('Already closed'));
      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      // Should not throw
      await ledger.disconnect();
    });
  });

  describe('getUserDataById', () => {
    it('returns user data with correct id and path', async () => {
      const pubKeyBytes = new Array(32).fill(1) as number[];
      const addressBytes = Array.from('L'.padEnd(35, 'X')).map((c) => c.charCodeAt(0));
      const transport = createMockTransport();
      transport.send = vi
        .fn()
        .mockResolvedValue(new Uint8Array([...pubKeyBytes, ...addressBytes, 0x90, 0x00]));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const user = await ledger.getUserDataById(3);
      expect(user.id).toBe(3);
      expect(user.path).toBe("44'/5741564'/0'/0'/3'");
      expect(user.address).toBe('L'.padEnd(35, 'X'));
      expect(user.publicKey).toBeTruthy();
      expect(user.statusCode).toBe('9000');
    });
  });

  describe('getVersion', () => {
    it('returns version from device', async () => {
      const transport = createMockTransport();
      transport.send = vi.fn().mockResolvedValue(new Uint8Array([2, 1, 0, 0x90, 0x00]));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const version = await ledger.getVersion();
      expect(version).toEqual([2, 1, 0]);
    });
  });

  describe('getPaginationUsersData', () => {
    it('returns multiple users', async () => {
      const pubKeyBytes = new Array(32).fill(1) as number[];
      const addressBytes = Array.from('L'.padEnd(35, 'A')).map((c) => c.charCodeAt(0));
      const transport = createMockTransport();
      transport.send = vi
        .fn()
        .mockResolvedValue(new Uint8Array([...pubKeyBytes, ...addressBytes, 0x90, 0x00]));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const users = await ledger.getPaginationUsersData(0, 2);
      expect(users.length).toBe(2); // from=0, limit=2 → indices 0, 1
      expect(users[0]!.id).toBe(0);
      expect(users[1]!.id).toBe(1);
    });

    it('returns empty array when limit is 0', async () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      const users = await ledger.getPaginationUsersData(0, 0);
      expect(users).toEqual([]);
    });

    it('throws RangeError when from is negative', async () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      await expect(ledger.getPaginationUsersData(-1, 5)).rejects.toThrow(RangeError);
      await expect(ledger.getPaginationUsersData(-1, 5)).rejects.toThrow("'from'");
    });

    it('throws RangeError when from is not an integer', async () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      await expect(ledger.getPaginationUsersData(0.5, 5)).rejects.toThrow(RangeError);
      await expect(ledger.getPaginationUsersData(NaN, 5)).rejects.toThrow(RangeError);
    });

    it('throws RangeError when limit is negative', async () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      await expect(ledger.getPaginationUsersData(0, -1)).rejects.toThrow(RangeError);
      await expect(ledger.getPaginationUsersData(0, -1)).rejects.toThrow("'limit'");
    });

    it('throws RangeError when limit is NaN', async () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      await expect(ledger.getPaginationUsersData(0, NaN)).rejects.toThrow(RangeError);
    });

    it('throws RangeError when limit is Infinity', async () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      await expect(ledger.getPaginationUsersData(0, Infinity)).rejects.toThrow(RangeError);
    });
  });

  describe('signTransaction', () => {
    it('signs and returns base58 signature', async () => {
      const signatureBytes = new Array(64).fill(0xab) as number[];
      const transport = createMockTransport();
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00])) // getVersion
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00]));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const sig = await ledger.signTransaction(0, {
        dataBuffer: new Uint8Array([1, 2, 3]),
        dataType: 4,
        dataVersion: 2,
      });
      expect(typeof sig).toBe('string');
      expect(sig.length).toBeGreaterThan(0);
    });
  });

  describe('signOrder', () => {
    it('signs order data', async () => {
      const signatureBytes = new Array(64).fill(0xcd) as number[];
      const transport = createMockTransport();
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]))
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00]));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const sig = await ledger.signOrder(0, {
        dataBuffer: new Uint8Array([10]),
        dataVersion: 1,
      });
      expect(typeof sig).toBe('string');
    });
  });

  describe('signSomeData', () => {
    it('signs arbitrary bytes', async () => {
      const signatureBytes = new Array(64).fill(0xef) as number[];
      const transport = createMockTransport();
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]))
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00]));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const sig = await ledger.signSomeData(0, { dataBuffer: new Uint8Array([0xff]) });
      expect(typeof sig).toBe('string');
    });
  });

  describe('signRequest', () => {
    it('signs request data', async () => {
      const signatureBytes = new Array(64).fill(0x11) as number[];
      const transport = createMockTransport();
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]))
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00]));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const sig = await ledger.signRequest(0, { dataBuffer: new Uint8Array([0x01]) });
      expect(typeof sig).toBe('string');
    });
  });

  describe('signMessage', () => {
    it('signs an ASCII message', async () => {
      const signatureBytes = new Array(64).fill(0x22) as number[];
      const transport = createMockTransport();
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]))
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00]));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const sig = await ledger.signMessage(0, 'Hello DCC');
      expect(typeof sig).toBe('string');
    });
  });

  describe('probeDevice', () => {
    it('returns true when device responds', async () => {
      const pubKeyBytes = new Array(32).fill(1) as number[];
      const addressBytes = Array.from('L'.padEnd(35, 'A')).map((c) => c.charCodeAt(0));
      const transport = createMockTransport();
      transport.send = vi
        .fn()
        .mockResolvedValue(new Uint8Array([...pubKeyBytes, ...addressBytes, 0x90, 0x00]));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const result = await ledger.probeDevice();
      expect(result).toBe(true);
    });

    it('returns false when device errors', async () => {
      const transport = createMockTransport();
      transport.send = vi.fn().mockRejectedValue(new Error('No device'));

      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();

      const result = await ledger.probeDevice();
      expect(result).toBe(false);
      expect(ledger.getLastError()).toBeInstanceOf(Error);
    });

    it('returns false (not throws) when tryConnect fails on unready device', async () => {
      const factory: LedgerTransportFactory = {
        create: vi.fn().mockRejectedValue(new Error('USB unavailable')),
      };
      const ledger = new DCCLedger({ transport: factory });

      // Device is not ready — probeDevice should catch the connect error, not throw
      const result = await ledger.probeDevice();
      expect(result).toBe(false);
      expect(ledger.getLastError()).toBeInstanceOf(Error);
    });
  });

  describe('getLastError', () => {
    it('returns null initially', async () => {
      const factory = createMockFactory();
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      expect(ledger.getLastError()).toBeNull();
    });
  });

  describe('debug mode', () => {
    it('enables listen logging when debug is true', async () => {
      const transport = createMockTransport();
      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory, debug: true });
      await ledger.tryConnect();
      // No assertion on listen() internals, just ensure no crash
      expect(ledger.ready).toBe(true);
    });
  });

  describe('exchange timeout', () => {
    it('sets exchange timeout on transport', async () => {
      const transport = createMockTransport();
      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory, exchangeTimeout: 5000 });
      await ledger.tryConnect();
      expect(transport.setExchangeTimeout).toHaveBeenCalledWith(5000);
    });

    it('does not set exchange timeout when undefined', async () => {
      const transport = createMockTransport();
      const factory = createMockFactory(transport);
      const ledger = new DCCLedger({ transport: factory });
      await ledger.tryConnect();
      expect(transport.setExchangeTimeout).not.toHaveBeenCalled();
    });
  });
});
