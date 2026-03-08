/**
 * Security Test Suite: Web Crypto AES-256-GCM encryption
 *
 * Tests that the shared crypto module correctly encrypts/decrypts
 * strings using AES-256-GCM with PBKDF2 key derivation.
 */
import { describe, expect, it } from 'vitest';
import { decryptString, encryptString } from '@/lib/crypto';

describe('Web Crypto AES-256-GCM', () => {
  it('should encrypt and decrypt a string correctly', async () => {
    const plaintext = 'seed phrase for testing wallet recovery';
    const password = 'C0mpl3x!P@ssw0rd';

    const encrypted = await encryptString(plaintext, password);
    const decrypted = await decryptString(encrypted, password);

    expect(decrypted).toBe(plaintext);
  });

  it('should produce base64 output', async () => {
    const encrypted = await encryptString('hello', 'password123');
    // Base64 uses [A-Za-z0-9+/=]
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('should produce different ciphertext each time (random salt+IV)', async () => {
    const plaintext = 'determinism test';
    const password = 'SamePassword1!';

    const encrypted1 = await encryptString(plaintext, password);
    const encrypted2 = await encryptString(plaintext, password);

    expect(encrypted1).not.toBe(encrypted2);

    // Both should still decrypt correctly
    expect(await decryptString(encrypted1, password)).toBe(plaintext);
    expect(await decryptString(encrypted2, password)).toBe(plaintext);
  });

  it('should fail decryption with wrong password', async () => {
    const encrypted = await encryptString('secret data', 'CorrectPassword1!');

    await expect(decryptString(encrypted, 'WrongPassword1!')).rejects.toThrow('Decryption failed');
  });

  it('should fail decryption with tampered ciphertext', async () => {
    const encrypted = await encryptString('important', 'P@ssword123');

    // Tamper with the base64 string — flip a character in the middle
    const chars = encrypted.split('');
    const mid = Math.floor(chars.length / 2);
    chars[mid] = chars[mid] === 'A' ? 'B' : 'A';
    const tampered = chars.join('');

    await expect(decryptString(tampered, 'P@ssword123')).rejects.toThrow('Decryption failed');
  });

  it('should handle empty string encryption', async () => {
    const encrypted = await encryptString('', 'P@ssword123');
    const decrypted = await decryptString(encrypted, 'P@ssword123');
    expect(decrypted).toBe('');
  });

  it('should handle unicode content', async () => {
    const plaintext = '🔐 Кошелёк 日本語テスト ñoño';
    const password = 'Üñïcödé!123';

    const encrypted = await encryptString(plaintext, password);
    const decrypted = await decryptString(encrypted, password);
    expect(decrypted).toBe(plaintext);
  });

  it('should handle long content', async () => {
    const plaintext = `${'word '.repeat(2000)}this is a very long seed phrase backup`;
    const password = 'LongContent!Test1';

    const encrypted = await encryptString(plaintext, password);
    const decrypted = await decryptString(encrypted, password);
    expect(decrypted).toBe(plaintext);
  });
});
