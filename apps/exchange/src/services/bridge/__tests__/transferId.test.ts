import { sha256 } from '@decentralchain/ts-lib-crypto';
import { describe, expect, it } from 'vitest';
import {
  deriveTransferId,
  readUserStateNonce,
  transferIdToHex,
  u64ToLeBytes,
} from '@/services/bridge/transferId';

const NONCE_OFFSET = 40;

/** A UserState account with `nonce` written little-endian at byte 40. */
const userState = (nonce: bigint, size = 64): Uint8Array => {
  const data = new Uint8Array(size);
  let remaining = nonce;
  for (let i = 0; i < 8; i++) {
    data[NONCE_OFFSET + i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
  return data;
};

describe('u64ToLeBytes', () => {
  it('encodes little-endian', () => {
    expect([...u64ToLeBytes(0n)]).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    expect([...u64ToLeBytes(1n)]).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);
    expect([...u64ToLeBytes(258n)]).toEqual([2, 1, 0, 0, 0, 0, 0, 0]);
  });

  it('handles the full u64 range without precision loss', () => {
    // Beyond Number.MAX_SAFE_INTEGER — the reason this takes a bigint.
    expect([...u64ToLeBytes(0xffff_ffff_ffff_ffffn)]).toEqual([
      255, 255, 255, 255, 255, 255, 255, 255,
    ]);
    expect([...u64ToLeBytes(9_007_199_254_740_993n)]).toEqual([1, 0, 0, 0, 0, 0, 32, 0]);
  });

  it('rejects values outside u64', () => {
    expect(() => u64ToLeBytes(-1n)).toThrow(/out of u64 range/);
    expect(() => u64ToLeBytes(1n << 64n)).toThrow(/out of u64 range/);
  });
});

describe('readUserStateNonce', () => {
  it('treats a missing account as nonce 0', () => {
    // The account does not exist until the sender's first deposit. That is
    // the normal first-time path, not an error.
    expect(readUserStateNonce(null)).toBe(0n);
  });

  it('reads a little-endian u64 from byte 40', () => {
    expect(readUserStateNonce(userState(0n))).toBe(0n);
    expect(readUserStateNonce(userState(1n))).toBe(1n);
    expect(readUserStateNonce(userState(258n))).toBe(258n);
    expect(readUserStateNonce(userState(42n))).toBe(42n);
  });

  it('reads large nonces exactly', () => {
    expect(readUserStateNonce(userState(0xffff_ffff_ffff_ffffn))).toBe(0xffff_ffff_ffff_ffffn);
  });

  it('ignores bytes outside the nonce window', () => {
    const data = userState(7n);
    data.fill(0xff, 0, NONCE_OFFSET);
    data.fill(0xff, NONCE_OFFSET + 8);

    expect(readUserStateNonce(data)).toBe(7n);
  });

  it('refuses an account too short to contain the nonce', () => {
    // Guessing here derives an id the bridge will never settle against.
    expect(() => readUserStateNonce(new Uint8Array(40))).toThrow(/Refusing to guess/);
  });
});

describe('deriveTransferId', () => {
  const pubkey = new Uint8Array(32).fill(7);

  it('is sha256 of pubkey followed by the little-endian nonce', () => {
    const expected = sha256(new Uint8Array([...pubkey, ...u64ToLeBytes(3n)]));

    expect(deriveTransferId(pubkey, 3n)).toEqual(expected);
  });

  it('produces 32 bytes', () => {
    expect(deriveTransferId(pubkey, 0n)).toHaveLength(32);
  });

  it('changes with the nonce', () => {
    expect(deriveTransferId(pubkey, 0n)).not.toEqual(deriveTransferId(pubkey, 1n));
  });

  it('changes with the sender', () => {
    expect(deriveTransferId(pubkey, 0n)).not.toEqual(
      deriveTransferId(new Uint8Array(32).fill(8), 0n),
    );
  });

  it('rejects a key that is not 32 bytes', () => {
    expect(() => deriveTransferId(new Uint8Array(31), 0n)).toThrow(/32 bytes/);
  });
});

describe('transferIdToHex', () => {
  it('pads every byte to two digits', () => {
    expect(transferIdToHex(new Uint8Array([0, 1, 15, 16, 255]))).toBe('00010f10ff');
  });

  it('produces the 64-character form the API expects', () => {
    expect(transferIdToHex(deriveTransferId(new Uint8Array(32), 0n))).toHaveLength(64);
  });
});
