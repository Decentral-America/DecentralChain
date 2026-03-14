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
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
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
      name: 'AES-GCM',
      iv,
    },
    key,
    dataBuffer
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
        name: 'AES-GCM',
        iv,
      },
      key,
      data
    );

    // Convert to string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error('Decryption failed - invalid password or corrupted data');
  }
};

/**
 * Get encryption password from session
 * In a real app, this would be derived from user's master password
 */
const getEncryptionPassword = (): string => {
  // For now, use a session-based key
  // In production, this should be derived from user's master password
  let sessionKey = sessionStorage.getItem('__session_encryption_key');

  if (!sessionKey) {
    // Generate random session key
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    sessionKey = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('__session_encryption_key', sessionKey);
  }

  return sessionKey;
};

/**
 * Secure Storage Interface
 */
export interface SecureStorageItem<T = any> {
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
  async setItem<T = any>(
    key: string,
    value: T,
    type: StorageKeyType = 'custom',
    encrypt: boolean = true
  ): Promise<void> {
    const item: SecureStorageItem<T> = {
      value,
      type,
      timestamp: Date.now(),
      encrypted: encrypt,
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
  async getItem<T = any>(key: string): Promise<T | null> {
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
      console.error('Failed to decrypt storage item:', error);
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
    sessionStorage.setItem('__session_encryption_key', key);
  }

  /**
   * Clear session encryption key (logout)
   */
  clearEncryptionKey(): void {
    sessionStorage.removeItem('__session_encryption_key');
  }
}

/**
 * Export singleton instance
 */
export const secureStorage = new SecureStorage();

/**
 * React hook for secure storage
 */
export const useSecureStorage = <T = any>(
  key: string,
  initialValue?: T
): [T | null, (value: T) => Promise<void>, () => void] => {
  const [value, setValue] = useState<T | null>(initialValue || null);

  useEffect(() => {
    secureStorage.getItem<T>(key).then((stored) => {
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
import { useState, useEffect } from 'react';
