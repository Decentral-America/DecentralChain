import { vi } from 'vitest';

// Use vi.hoisted so the class is available when vi.mock runs (hoisted before imports)
const { MockLedger } = vi.hoisted(() => {
  class MockLedger {
    private users: Record<
      number,
      { id: number; address: string; publicKey: string; statusCode: string }
    > = {
      1: {
        address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
        id: 1,
        publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
        statusCode: 'U2F_V2',
      },
      2: {
        address: '3P5GB69tyeW1BEEwdw8w74fusTZdrTXZPQL',
        id: 2,
        publicKey: 'B2Rd3SSLydLDaRjQngaZ8sMH9VAKbLrdyVysG7PDeKRs',
        statusCode: 'U2F_V2',
      },
    };

    getVersion() {
      return '0.1.0';
    }

    async getUserDataById(id: number) {
      const user = this.users[id];
      if (!user) throw new Error('User not found');
      return user;
    }

    async getPaginationUsersData(from: number, to: number) {
      const result = [];
      for (let i = from; i <= to; i++) {
        if (this.users[i]) result.push(this.users[i]);
      }
      return result;
    }

    async probeDevice() {
      return true;
    }

    async signRequest(_userId: number, _data: { dataBuffer: Uint8Array }) {
      return 'mockRequestSignature';
    }

    async signTransaction(
      _userId: number,
      _data: {
        dataBuffer: Uint8Array;
        amountPrecision: number;
        feePrecision: number;
        dataType: number;
        dataVersion: number;
        amount2Precision?: number;
      },
    ) {
      return 'mockTxSignature';
    }

    async signOrder(
      _userId: number,
      _data: {
        dataBuffer: Uint8Array;
        amountPrecision: number;
        feePrecision: number;
        dataVersion: number;
      },
    ) {
      return 'mockOrderSignature';
    }

    async signSomeData(_userId: number, _data: { dataBuffer: Uint8Array }) {
      return 'mockDataSignature';
    }
  }
  return { MockLedger };
});

// Mock the ledger module to prevent U2F transport from accessing `window` in Node
vi.mock('@decentralchain/ledger', () => ({
  DCCLedger: MockLedger,
}));

import { LedgerAdapter } from '../src/adapters/LedgerAdapter';
import { SIGN_TYPE } from '../src/prepareTx';

describe('LedgerAdapter', () => {
  const mockUser = {
    address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
    id: 1,
    publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
  };

  beforeAll(() => {
    LedgerAdapter.initOptions({
      debug: false,
      networkCode: 'W'.charCodeAt(0),
    } as any);
    // Override the ledger instance with mock
    (LedgerAdapter as any)._ledger = new MockLedger();
  });

  it('constructs with valid user', () => {
    const adapter = new LedgerAdapter(mockUser);
    expect(adapter.isDestroyed()).toBe(false);
  });

  it('throws when constructed without user', () => {
    expect(() => new LedgerAdapter(null)).toThrow('No selected user');
  });

  it('returns correct sync address', () => {
    const adapter = new LedgerAdapter(mockUser);
    expect(adapter.getSyncAddress()).toBe(mockUser.address);
  });

  it('returns correct sync public key', () => {
    const adapter = new LedgerAdapter(mockUser);
    expect(adapter.getSyncPublicKey()).toBe(mockUser.publicKey);
  });

  it('getPublicKey resolves with public key', async () => {
    const adapter = new LedgerAdapter(mockUser);
    const pk = await adapter.getPublicKey();
    expect(pk).toBe(mockUser.publicKey);
  });

  it('getAddress resolves with address', async () => {
    const adapter = new LedgerAdapter(mockUser);
    const addr = await adapter.getAddress();
    expect(addr).toBe(mockUser.address);
  });

  it('getSeed rejects', async () => {
    const adapter = new LedgerAdapter(mockUser);
    await expect(adapter.getSeed()).rejects.toThrow('Method "getSeed" is not available!');
  });

  it('getEncodedSeed rejects', async () => {
    const adapter = new LedgerAdapter(mockUser);
    await expect(adapter.getEncodedSeed()).rejects.toThrow(
      'Method "getEncodedSeed" is not available!',
    );
  });

  it('getPrivateKey rejects', async () => {
    const adapter = new LedgerAdapter(mockUser);
    await expect(adapter.getPrivateKey()).rejects.toThrow('No private key');
  });

  it('signRequest delegates to ledger', async () => {
    const adapter = new LedgerAdapter(mockUser);
    const sig = await adapter.signRequest(new Uint8Array([1, 2, 3]));
    expect(sig).toBe('mockRequestSignature');
  });

  it('signTransaction delegates to ledger', async () => {
    const adapter = new LedgerAdapter(mockUser);
    const sig = await adapter.signTransaction(
      new Uint8Array([4, 5, 6]),
      { amount2Precision: 0, amountPrecision: 8, feePrecision: 8 },
      { data: { version: 2 }, type: 4 },
    );
    expect(sig).toBe('mockTxSignature');
  });

  it('signTransaction with data byte (15) delegates to signData', async () => {
    const adapter = new LedgerAdapter(mockUser);
    const bytes = new Uint8Array([15, 1, 2, 3]);
    const sig = await adapter.signTransaction(bytes, {} as any, {} as any);
    expect(sig).toBe('mockDataSignature');
  });

  it('signOrder delegates to ledger', async () => {
    const adapter = new LedgerAdapter(mockUser);
    const sig = await adapter.signOrder(
      new Uint8Array([7, 8, 9]),
      { amountPrecision: 8, feePrecision: 8 },
      { data: { version: 3 } },
    );
    expect(sig).toBe('mockOrderSignature');
  });

  it('signData delegates to ledger', async () => {
    const adapter = new LedgerAdapter(mockUser);
    const sig = await adapter.signData(new Uint8Array([10, 11, 12]));
    expect(sig).toBe('mockDataSignature');
  });

  it('isAvailable validates ledger has correct user', async () => {
    const adapter = new LedgerAdapter(mockUser);
    await expect(adapter.isAvailable()).resolves.toBeUndefined();
  });

  it('isAvailable rejects when address mismatch', async () => {
    const wrongUser = { ...mockUser, address: 'wrongAddress', id: 1 };
    const adapter = new LedgerAdapter(wrongUser);
    await expect(adapter.isAvailable()).rejects.toThrow('Invalid ledger: address mismatch');
    expect(adapter.isDestroyed()).toBe(true);
  });

  it('getSignVersions returns correct version map', () => {
    const adapter = new LedgerAdapter(mockUser);
    const versions = adapter.getSignVersions();
    expect(versions[SIGN_TYPE.AUTH]).toEqual([1]);
    expect(versions[SIGN_TYPE.TRANSFER]).toEqual([2]);
    expect(versions[SIGN_TYPE.CREATE_ORDER]).toEqual([1, 2, 3, 4]);
    expect(versions[SIGN_TYPE.EXCHANGE]).toEqual([0, 1, 2]);
  });

  it('getAdapterVersion returns ledger version', () => {
    const adapter = new LedgerAdapter(mockUser);
    expect((adapter as any).getAdapterVersion()).toBe('0.1.0');
  });

  it('static getUserList returns users from ledger', async () => {
    const users = await LedgerAdapter.getUserList(1, 2);
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBe(2);
  });

  it('static isAvailable resolves to true when device is present', async () => {
    // Reset the connection promise
    (LedgerAdapter as any)._hasConnectionPromise = null;
    const result = await LedgerAdapter.isAvailable();
    expect(result).toBe(true);
  });

  it('static isAvailable returns false when device probe fails', async () => {
    const failMock = new MockLedger();
    failMock.probeDevice = async () => {
      throw new Error('No device');
    };
    (LedgerAdapter as any)._ledger = failMock;
    (LedgerAdapter as any)._hasConnectionPromise = null;

    const result = await LedgerAdapter.isAvailable();
    expect(result).toBe(false);

    // Restore working mock
    (LedgerAdapter as any)._ledger = new MockLedger();
  });
});
