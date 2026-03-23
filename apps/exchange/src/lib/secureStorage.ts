/**
 * Secure Storage Module
 * Uses Web Crypto API for encryption/decryption of sensitive data
 * Zero external dependencies - pure browser APIs
 */

/**
 * Storage Key Type
 */
export type StorageKeyType = 'seed' | 'privateKey' | 'password' | 'session' | 'custom';

/**
 * Generate encryption key from password
 */
const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await window.crypto.subtle.importKey('raw', passwordBuffer, 'PBKDF2', false, [
    'deriveBits',
    'deriveKey',
  ]);

  // Derive key using PBKDF2
  return window.crypto.subtle.deriveKey(
    {
      hash: 'SHA-256',
      iterations: 600000, // OWASP 2024 recommendation for PBKDF2-SHA256
      name: 'PBKDF2',
      salt: salt as BufferSource,
    },
    keyMaterial,
    {
      length: 256,
      name: 'AES-GCM',
    },
    false,
    ['encrypt', 'decrypt'],
  );
};

/**
 * Encrypt data using AES-GCM
 */
const encryptData = async (data: string, password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Generate random salt and IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Derive encryption key
  const key = await deriveKey(password, salt);

  // Encrypt data
  const encrypted = await window.crypto.subtle.encrypt(
    {
      iv,
      name: 'AES-GCM',
    },
    key,
    dataBuffer,
  );

  // Combine salt + IV + encrypted data
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
};

/**
 * Decrypt data using AES-GCM
 */
const decrypt = async (encryptedData: string, password: string): Promise<string> => {
  try {
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    // Derive decryption key
    const key = await deriveKey(password, salt);

    // Decrypt data
    const decrypted = await window.crypto.subtle.decrypt(
      {
        iv,
        name: 'AES-GCM',
      },
      key,
      data,
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch {
    throw new Error('Decryption failed - invalid password or corrupted data');
  }
};

/**
 * Get encryption password from session.
 * SECURITY: The encryption key MUST be derived from the user's master password
 * via setEncryptionKey() during login. If no key is set, SecureStorage operations
 * will throw rather than silently using a weak fallback.
 *
 * The key is stored in sessionStorage (cleared on tab close), which is the
 * best browser-available option. XSS mitigation requirements:
 *   1. Set a strict CSP header (no inline scripts, trusted origins only)
 *   2. Sanitize all user input
 *   3. Do NOT embed the key in DOM or global variables
 *
 * The key name is obfuscated to make casual scraping harder (defense-in-depth).
 */
const SESSION_KEY_NAME = `_dcc_sk_${btoa('session_encryption_key').slice(0, 8)}`;

const getEncryptionPassword = (): string => {
  const sessionKey = sessionStorage.getItem(SESSION_KEY_NAME);

  if (!sessionKey) {
    throw new Error(
      'SecureStorage: No encryption key set. Call secureStorage.setEncryptionKey() after user login.',
    );
  }

  return sessionKey;
};

/**
 * Secure Storage Interface
 */
export interface SecureStorageItem<T = unknown> {
  value: T;
  type: StorageKeyType;
  timestamp: number;
  encrypted: boolean;
}

/**
 * Secure Storage Class
 */
class SecureStorage {
  private storagePrefix = '__secure_';

  /**
   * Set item in secure storage (encrypted)
   */
  async setItem<T = unknown>(
    key: string,
    value: T,
    type: StorageKeyType = 'custom',
    encrypt: boolean = true,
  ): Promise<void> {
    const item: SecureStorageItem<T> = {
      encrypted: encrypt,
      timestamp: Date.now(),
      type,
      value,
    };

    const serialized = JSON.stringify(item);
    const storageKey = this.storagePrefix + key;

    if (encrypt) {
      const password = getEncryptionPassword();
      const encryptedData = await encryptData(serialized, password);
      localStorage.setItem(storageKey, encryptedData);
    } else {
      localStorage.setItem(storageKey, serialized);
    }
  }

  /**
   * Get item from secure storage (decrypted)
   */
  async getItem<T = unknown>(key: string): Promise<T | null> {
    const storageKey = this.storagePrefix + key;
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return null;
    }

    try {
      // Try to parse as JSON first (unencrypted)
      const item = JSON.parse(stored) as SecureStorageItem<T>;
      if (!item.encrypted) {
        return item.value;
      }
    } catch {
      // Not JSON, assume encrypted
    }

    // Decrypt
    try {
      const password = getEncryptionPassword();
      const decrypted = await decrypt(stored, password);
      const item = JSON.parse(decrypted) as SecureStorageItem<T>;
      return item.value;
    } catch (error) {
      logger.error('Failed to decrypt storage item:', error);
      return null;
    }
  }

  /**
   * Remove item from storage
   */
  removeItem(key: string): void {
    const storageKey = this.storagePrefix + key;
    localStorage.removeItem(storageKey);
  }

  /**
   * Clear all secure storage items
   */
  clear(): void {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.storagePrefix)) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Get all secure storage keys
   */
  getKeys(): string[] {
    const keys = Object.keys(localStorage);
    return keys
      .filter((key) => key.startsWith(this.storagePrefix))
      .map((key) => key.replace(this.storagePrefix, ''));
  }

  /**
   * Check if key exists
   */
  hasItem(key: string): boolean {
    const storageKey = this.storagePrefix + key;
    return localStorage.getItem(storageKey) !== null;
  }

  /**
   * Set session encryption key (for master password flow)
   */
  setEncryptionKey(key: string): void {
    sessionStorage.setItem(SESSION_KEY_NAME, key);
  }

  /**
   * Clear session encryption key (logout)
   */
  clearEncryptionKey(): void {
    sessionStorage.removeItem(SESSION_KEY_NAME);
  }
}

/**
 * Export singleton instance
 */
export const secureStorage = new SecureStorage();

/**
 * React hook for secure storage
 */
export const useSecureStorage = <T = unknown>(
  key: string,
  initialValue?: T,
): [T | null, (value: T) => Promise<void>, () => void] => {
  const [value, setValue] = useState<T | null>(initialValue || null);

  useEffect(() => {
    void secureStorage.getItem<T>(key).then((stored) => {
      if (stored !== null) {
        setValue(stored);
      }
    });
  }, [key]);

  const setStoredValue = async (newValue: T) => {
    await secureStorage.setItem(key, newValue);
    setValue(newValue);
  };

  const removeStoredValue = () => {
    secureStorage.removeItem(key);
    setValue(null);
  };

  return [value, setStoredValue, removeStoredValue];
};

// Import useState and useEffect for the hook
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';
