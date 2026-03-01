import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DCC } from '../src/dcc.js';
import type { LedgerTransport } from '../src/types.js';

/**
 * Helper: build a Uint8Array that looks like a Ledger device response.
 * Appends the 2-byte status word (default 0x9000 = OK).
 */
function ledgerResponse(payload: number[], status = [0x90, 0x00]): Uint8Array {
  return new Uint8Array([...payload, ...status]);
}

function createMockTransport(overrides: Partial<LedgerTransport> = {}): LedgerTransport {
  return {
    send: vi.fn().mockResolvedValue(ledgerResponse([])),
    close: vi.fn().mockResolvedValue(undefined),
    setExchangeTimeout: vi.fn(),
    decorateAppAPIMethods: vi.fn(),
    ...overrides,
  };
}

describe('DCC', () => {
  let transport: LedgerTransport;
  let dcc: DCC;

  beforeEach(() => {
    transport = createMockTransport();
    dcc = new DCC(transport);
  });

  describe('constructor', () => {
    it('decorates API methods on the transport', () => {
      expect(transport.decorateAppAPIMethods).toHaveBeenCalledWith(
        dcc,
        ['getWalletPublicKey', '_signData', 'getVersion'],
        'WAVES', // Ledger firmware app identifier
      );
    });

    it('uses default mainnet network code 76', () => {
      // The networkCode is used in signing — test indirectly via signData
      expect(dcc).toBeDefined();
    });

    it('accepts custom network code', () => {
      const customDcc = new DCC(transport, 84);
      expect(customDcc).toBeDefined();
    });

    it('throws RangeError when networkCode exceeds uint8', () => {
      expect(() => new DCC(transport, 256)).toThrow(RangeError);
      expect(() => new DCC(transport, 256)).toThrow('networkCode must be an integer in [0, 255]');
    });

    it('throws RangeError when networkCode is negative', () => {
      expect(() => new DCC(transport, -1)).toThrow(RangeError);
    });

    it('throws RangeError when networkCode is not an integer', () => {
      expect(() => new DCC(transport, 76.5)).toThrow(RangeError);
    });
  });

  describe('splitPath', () => {
    it('parses a standard BIP-44 path', () => {
      const result = DCC.splitPath("44'/5741564'/0'/0'/0'");
      // 44' = 44 + 0x80000000 = 0x8000002C
      // 5741564' = 5741564 + 0x80000000 = 0x80579BFC
      expect(result.length).toBe(20); // 5 components × 4 bytes
      const view = new DataView(result.buffer);
      expect(view.getUint32(0, false)).toBe(0x8000002c);
      expect(view.getUint32(4, false)).toBe(0x80579bfc);
      expect(view.getUint32(8, false)).toBe(0x80000000);
      expect(view.getUint32(12, false)).toBe(0x80000000);
      expect(view.getUint32(16, false)).toBe(0x80000000);
    });

    it('handles non-hardened path elements', () => {
      const result = DCC.splitPath('44/0/1');
      const view = new DataView(result.buffer);
      expect(view.getUint32(0, false)).toBe(44);
      expect(view.getUint32(4, false)).toBe(0);
      expect(view.getUint32(8, false)).toBe(1);
    });

    it('skips the m root prefix', () => {
      const result = DCC.splitPath("m/44'/0'");
      // "m" should be skipped, "44'" and "0'" should be parsed
      expect(result.length).toBe(8); // 2 components × 4 bytes
    });

    it('throws on empty path', () => {
      expect(() => DCC.splitPath('')).toThrow('Invalid BIP-44 path component');
    });

    it('throws on path with only invalid components', () => {
      expect(() => DCC.splitPath('m')).toThrow('must contain at least one component');
    });

    it('throws on non-numeric path element', () => {
      expect(() => DCC.splitPath("44'/abc/0'")).toThrow('Invalid BIP-44 path component');
    });

    it('throws on negative path index', () => {
      expect(() => DCC.splitPath("44'/-1/0'")).toThrow('Invalid BIP-44 path component');
    });

    it('throws on path index exceeding BIP-44 max', () => {
      expect(() => DCC.splitPath("44'/2147483648'")).toThrow('exceeds maximum');
    });

    it('throws on floating-point path index', () => {
      expect(() => DCC.splitPath("44'/1.5/0'")).toThrow('Invalid BIP-44 path component');
    });
  });

  describe('checkError', () => {
    it('returns null for SW_OK (0x9000)', () => {
      expect(DCC.checkError([0x90, 0x00])).toBeNull();
    });

    it('returns error for user cancelled (0x9100)', () => {
      const result = DCC.checkError([0x91, 0x00]);
      expect(result).toEqual({ error: 'User cancelled', status: 0x9100 });
    });

    it('returns error for device locked (0x6986)', () => {
      const result = DCC.checkError([0x69, 0x86]);
      expect(result).toEqual({ error: 'Device is locked', status: 0x6986 });
    });

    it('handles empty data gracefully', () => {
      const result = DCC.checkError([]);
      expect(result).toEqual({ error: 'Unknown error (0x0000)', status: 0 });
    });

    it.each([
      [0x9100, 'User cancelled'],
      [0x9102, 'Deprecated sign protocol'],
      [0x9103, 'Incorrect precision value'],
      [0x9104, 'Incorrect transaction type/version'],
      [0x9105, 'Protobuf decoding failed'],
      [0x9106, 'Byte decoding failed'],
      [0x6982, 'Security status not satisfied'],
      [0x6985, 'Conditions not satisfied'],
      [0x6986, 'Device is locked'],
      [0x6990, 'Buffer overflow'],
      [0x6a86, 'Incorrect P1/P2'],
      [0x6d00, 'Instruction not supported'],
      [0x6e00, 'CLA not supported'],
    ] as const)('maps status 0x%s to "%s"', (code, message) => {
      const high = (code >> 8) & 0xff;
      const low = code & 0xff;
      expect(DCC.checkError([high, low])).toEqual({ error: message, status: code });
    });

    it('returns descriptive message for unknown status', () => {
      const result = DCC.checkError([0xab, 0xcd]);
      expect(result).toEqual({ error: 'Unknown error (0xabcd)', status: 0xabcd });
    });
  });

  describe('getWalletPublicKey', () => {
    it('returns public key and address', async () => {
      // Build a mock response: 32 bytes pubkey + 35 bytes address + 2 bytes status
      const pubKeyBytes = new Array(32).fill(1) as number[];
      const addressBytes = Array.from('L'.padEnd(35, 'A')).map((c) => c.charCodeAt(0));
      const statusBytes = [0x90, 0x00];

      transport.send = vi
        .fn()
        .mockResolvedValue(new Uint8Array([...pubKeyBytes, ...addressBytes, ...statusBytes]));

      const result = await dcc.getWalletPublicKey("44'/5741564'/0'/0'/0'");
      expect(result.publicKey).toBeTruthy();
      expect(result.address).toBe('L'.padEnd(35, 'A'));
      expect(result.statusCode).toBe('9000');
    });

    it('calls transport.send with correct APDU', async () => {
      const pubKeyBytes = new Array(32).fill(0) as number[];
      const addressBytes = new Array(35).fill(65) as number[];
      transport.send = vi
        .fn()
        .mockResolvedValue(new Uint8Array([...pubKeyBytes, ...addressBytes, 0x90, 0x00]));

      await dcc.getWalletPublicKey("44'/5741564'/0'/0'/0'", true);
      expect(transport.send).toHaveBeenCalledWith(
        0x80,
        0x04,
        0x80, // verify = true
        76, // networkCode
        expect.any(Uint8Array),
      );
    });

    it('throws when device returns error status code', async () => {
      const pubKeyBytes = new Array(32).fill(0) as number[];
      const addressBytes = new Array(35).fill(65) as number[];
      transport.send = vi
        .fn()
        .mockResolvedValue(new Uint8Array([...pubKeyBytes, ...addressBytes, 0x69, 0x85]));

      await expect(dcc.getWalletPublicKey("44'/5741564'/0'/0'/0'")).rejects.toMatchObject({
        message: 'Conditions not satisfied',
        cause: { error: 'Conditions not satisfied', status: 0x6985 },
      });
    });

    it('throws on response shorter than minimum expected length', async () => {
      transport.send = vi.fn().mockResolvedValue(new Uint8Array([0x90, 0x00]));

      await expect(dcc.getWalletPublicKey("44'/5741564'/0'/0'/0'")).rejects.toThrow(
        'Invalid response: expected at least 69 bytes, got 2',
      );
    });
  });

  describe('getVersion', () => {
    it('returns version array stripped of status bytes', async () => {
      transport.send = vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 0x90, 0x00]));

      const version = await dcc.getVersion();
      expect(version).toEqual([1, 2, 3]);
    });

    it('caches the version on subsequent calls', async () => {
      transport.send = vi.fn().mockResolvedValue(new Uint8Array([1, 0, 0, 0x90, 0x00]));

      await dcc.getVersion();
      await dcc.getVersion();
      // send should only be called once (cached + constructor decorateAppAPIMethods)
      expect(transport.send).toHaveBeenCalledTimes(1);
    });

    it('clears cache and rethrows on error', async () => {
      transport.send = vi.fn().mockRejectedValue(new Error('Device disconnected'));

      await expect(dcc.getVersion()).rejects.toThrow('Device disconnected');
      // Next call should retry
      transport.send = vi.fn().mockResolvedValue(new Uint8Array([2, 0, 0, 0x90, 0x00]));
      const version = await dcc.getVersion();
      expect(version).toEqual([2, 0, 0]);
    });

    it('throws when device returns error status', async () => {
      transport.send = vi.fn().mockResolvedValue(new Uint8Array([1, 0, 0, 0x69, 0x85]));

      await expect(dcc.getVersion()).rejects.toThrow('Conditions not satisfied');
      await expect(
        // Reset mock for fresh call (cache cleared on error)
        ((): Promise<number[]> => {
          transport.send = vi.fn().mockResolvedValue(new Uint8Array([1, 0, 0, 0x69, 0x85]));
          return dcc.getVersion();
        })(),
      ).rejects.toMatchObject({
        message: 'Conditions not satisfied',
        cause: { error: 'Conditions not satisfied', status: 0x6985 },
      });
    });
  });

  describe('signTransaction', () => {
    it('signs tx data through the chunked protocol', async () => {
      // First call: getVersion
      // Subsequent calls: signing chunks
      const signatureBytes = new Array(64).fill(0xab) as number[];
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00])) // getVersion
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00])); // sign result

      const result = await dcc.signTransaction("44'/5741564'/0'/0'/0'", {
        dataBuffer: new Uint8Array([1, 2, 3]),
        dataType: 4,
        dataVersion: 2,
      });

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('throws RangeError when amountPrecision exceeds uint8', async () => {
      transport.send = vi.fn().mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]));

      await expect(
        dcc.signTransaction("44'/5741564'/0'/0'/0'", {
          dataBuffer: new Uint8Array([1]),
          dataType: 4,
          dataVersion: 1,
          amountPrecision: 256,
        }),
      ).rejects.toThrow('amountPrecision must be an integer in [0, 255]');
    });

    it('throws RangeError when dataType exceeds uint8', async () => {
      transport.send = vi.fn().mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]));

      await expect(
        dcc.signTransaction("44'/5741564'/0'/0'/0'", {
          dataBuffer: new Uint8Array([1]),
          dataType: 300,
          dataVersion: 1,
        }),
      ).rejects.toThrow('dataType must be an integer in [0, 255]');
    });
  });

  describe('signOrder', () => {
    it('signs order data with ORDER code', async () => {
      const signatureBytes = new Array(64).fill(0xcd) as number[];
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]))
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00]));

      const result = await dcc.signOrder("44'/5741564'/0'/0'/0'", {
        dataBuffer: new Uint8Array([10, 20, 30]),
        dataVersion: 1,
      });

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('signSomeData', () => {
    it('signs arbitrary data', async () => {
      const signatureBytes = new Array(64).fill(0xef) as number[];
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]))
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00]));

      const result = await dcc.signSomeData("44'/5741564'/0'/0'/0'", {
        dataBuffer: new Uint8Array([0xff]),
      });

      expect(typeof result).toBe('string');
    });
  });

  describe('signRequest', () => {
    it('signs a request payload', async () => {
      const signatureBytes = new Array(64).fill(0x11) as number[];
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]))
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00]));

      const result = await dcc.signRequest("44'/5741564'/0'/0'/0'", {
        dataBuffer: new Uint8Array([0x01]),
      });

      expect(typeof result).toBe('string');
    });
  });

  describe('signMessage', () => {
    it('signs a message payload', async () => {
      const signatureBytes = new Array(64).fill(0x22) as number[];
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00]))
        .mockResolvedValue(new Uint8Array([...signatureBytes, 0x90, 0x00]));

      const result = await dcc.signMessage("44'/5741564'/0'/0'/0'", {
        dataBuffer: new Uint8Array([72, 101, 108, 108, 111]),
      });

      expect(typeof result).toBe('string');
    });
  });

  describe('_fillDataForSign firmware version branching', () => {
    it('uses v1.2.0 format with amount2Precision', async () => {
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 2, 0, 0x90, 0x00])) // version 1.2.0
        .mockResolvedValue(new Uint8Array(new Array(64).fill(0).concat([0x90, 0x00])));

      await dcc.signTransaction("44'/5741564'/0'/0'/0'", {
        dataBuffer: new Uint8Array([1, 2, 3]),
        dataType: 4,
        dataVersion: 2,
        amountPrecision: 6,
        amount2Precision: 2,
        feePrecision: 8,
      });

      // Verify the signing chunk was sent
      expect(transport.send).toHaveBeenCalledTimes(2);
    });

    it('uses v1.2.0 format for higher major versions (e.g. 2.0.0)', async () => {
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([2, 0, 0, 0x90, 0x00])) // version 2.0.0
        .mockResolvedValue(new Uint8Array(new Array(64).fill(0).concat([0x90, 0x00])));

      await dcc.signTransaction("44'/5741564'/0'/0'/0'", {
        dataBuffer: new Uint8Array([1, 2, 3]),
        dataType: 4,
        dataVersion: 2,
        amountPrecision: 6,
        amount2Precision: 3,
        feePrecision: 8,
      });

      // version 2.0.0 must use the newest protocol format (>= 1.2.0)
      expect(transport.send).toHaveBeenCalledTimes(2);
    });

    it('uses v1.1.0 format without amount2Precision', async () => {
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 1, 0, 0x90, 0x00])) // version 1.1.0
        .mockResolvedValue(new Uint8Array(new Array(64).fill(0).concat([0x90, 0x00])));

      await dcc.signTransaction("44'/5741564'/0'/0'/0'", {
        dataBuffer: new Uint8Array([1, 2, 3]),
        dataType: 4,
        dataVersion: 1,
      });

      expect(transport.send).toHaveBeenCalledTimes(2);
    });

    it('uses legacy format for firmware < 1.1.0', async () => {
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 0, 0, 0x90, 0x00])) // version 1.0.0
        .mockResolvedValue(new Uint8Array(new Array(64).fill(0).concat([0x90, 0x00])));

      await dcc.signTransaction("44'/5741564'/0'/0'/0'", {
        dataBuffer: new Uint8Array([1, 2]),
        dataType: 3,
        dataVersion: 1,
      });

      expect(transport.send).toHaveBeenCalledTimes(2);
    });
  });

  describe('_signData chunking', () => {
    it('sends data in chunks when larger than max size', async () => {
      // MAX_SIZE is 128, chunk size is 128 - 5 = 123
      const largeData = new Uint8Array(250).fill(0xaa);
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 0, 0, 0x90, 0x00])) // version
        .mockResolvedValue(new Uint8Array(new Array(64).fill(0).concat([0x90, 0x00])));

      await dcc.signTransaction("44'/5741564'/0'/0'/0'", {
        dataBuffer: largeData,
        dataType: 4,
        dataVersion: 1,
      });

      // getVersion (1) + multiple signing chunks
      const sendCalls = (transport.send as ReturnType<typeof vi.fn>).mock.calls.length;
      expect(sendCalls).toBeGreaterThan(2);
    });

    it('throws when device returns error during signing', async () => {
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 0, 0, 0x90, 0x00])) // version
        .mockResolvedValue(new Uint8Array([0x69, 0x85])); // error status

      await expect(
        dcc.signTransaction("44'/5741564'/0'/0'/0'", {
          dataBuffer: new Uint8Array([1]),
          dataType: 4,
          dataVersion: 1,
        }),
      ).rejects.toMatchObject({
        message: 'Conditions not satisfied',
        cause: { error: 'Conditions not satisfied', status: 0x6985 },
      });
    });
  });

  describe('_signData empty payload guard', () => {
    it('throws when data buffer is empty', async () => {
      transport.send = vi.fn().mockResolvedValueOnce(new Uint8Array([1, 0, 0, 0x90, 0x00]));

      await expect(
        dcc.signTransaction("44'/5741564'/0'/0'/0'", {
          dataBuffer: new Uint8Array([]),
          dataType: 4,
          dataVersion: 1,
        }),
      ).rejects.toThrow('dataBuffer must not be empty');
    });
  });

  describe('_signData empty signature guard', () => {
    it('throws when device returns empty signature', async () => {
      transport.send = vi
        .fn()
        .mockResolvedValueOnce(new Uint8Array([1, 0, 0, 0x90, 0x00])) // version
        .mockResolvedValue(new Uint8Array([0x90, 0x00])); // only status, no sig

      await expect(
        dcc.signTransaction("44'/5741564'/0'/0'/0'", {
          dataBuffer: new Uint8Array([1]),
          dataType: 4,
          dataVersion: 1,
        }),
      ).rejects.toThrow('Device returned an empty signature');
    });
  });
});
