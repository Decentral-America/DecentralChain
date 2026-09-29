import { describe, expect, it } from 'vitest';
import { isLegacyEncryptedVault, LegacyVaultError } from '@/services/multiAccount';

/**
 * A vault written before DCC-176 cannot be opened by any password, and the
 * create-wallet flow has to know that before it spends 600k PBKDF2 rounds
 * proving it. These pin the one byte that decides.
 */
const b64 = (bytes: number[]) => btoa(String.fromCharCode(...bytes));

/** Current format: version 0x01, then salt(16) + iv(12) + ciphertext. */
const current = b64([0x01, ...Array.from({ length: 40 }, (_, i) => i)]);

/** Pre-DCC-176 OpenSSL framing: the ASCII of "Salted__". */
const legacy = b64([0x53, 0x61, 0x6c, 0x74, 0x65, 0x64, 0x5f, 0x5f, 1, 2, 3, 4]);

describe('isLegacyEncryptedVault', () => {
  it('accepts data this build wrote', () => {
    expect(isLegacyEncryptedVault(current)).toBe(false);
  });

  it('flags the pre-DCC-176 OpenSSL format', () => {
    expect(isLegacyEncryptedVault(legacy)).toBe(true);
  });

  it('treats unparseable data as legacy, because it is equally unopenable', () => {
    expect(isLegacyEncryptedVault('not base64 !!!')).toBe(true);
  });

  it('reports no vault at all as not-legacy, so a first-run signs up', () => {
    // The distinction matters: an absent vault takes the signUp branch, and
    // calling it legacy would offer a destructive reset to someone with nothing
    // to destroy.
    expect(isLegacyEncryptedVault('')).toBe(false);
  });

  it('carries a name the UI can branch on without matching prose', () => {
    const err = new LegacyVaultError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('LegacyVaultError');
  });
});
