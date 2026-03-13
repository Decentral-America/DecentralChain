import { logger } from '@/lib/logger';
/**
 * Storage Exporter Utility
 * Handles exporting and importing wallet data with encryption support
 */

/**
 * Export data structure
 */
export interface ExportData {
  /**
   * User accounts data
   */
  accounts: Record<string, unknown>[];

  /**
   * Application settings
   */
  settings: Record<string, unknown>;

  /**
   * Multi-account data
   */
  multiAccountData?: Record<string, unknown>;

  /**
   * User list
   */
  userList?: Record<string, unknown>[];

  /**
   * Export timestamp
   */
  timestamp: number;

  /**
   * Export format version
   */
  version: string;

  /**
   * Whether data is encrypted
   */
  encrypted: boolean;
}

/**
 * Storage keys to export
 */
const EXPORT_KEYS = [
  'accounts',
  'settings',
  'multiAccountData',
  'multiAccountUsers',
  'multiAccountSettings',
  'multiAccountHash',
  'userList',
  'openClientMode',
  'theme',
  'language',
  'network',
] as const;

/**
 * Export wallet data from localStorage
 * @param keys - Optional specific keys to export (defaults to all)
 * @returns Export data object
 */
export const exportData = (keys: readonly string[] = EXPORT_KEYS): ExportData => {
  const data: Record<string, unknown> = {};

  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          // Try parsing as JSON
          data[key] = JSON.parse(value);
        } catch {
          // Store as string if not JSON
          data[key] = value;
        }
      }
    } catch (error) {
      logger.error(`Failed to export key "${key}":`, error);
    }
  }

  return {
    ...data,
    timestamp: Date.now(),
    version: '1.0.0',
    encrypted: false,
  } as ExportData;
};

/**
 * Import wallet data to localStorage
 * @param data - Export data object
 * @param overwrite - Whether to overwrite existing keys (default: true)
 * @returns Success status and count of imported keys
 */
export const importData = (
  data: ExportData,
  overwrite: boolean = true,
): { success: boolean; imported: number; errors: string[] } => {
  let imported = 0;
  const errors: string[] = [];

  try {
    // Validate version
    if (!data.version || data.version !== '1.0.0') {
      logger.warn('Import data version mismatch:', data.version);
    }

    // Import each key — ONLY keys in the EXPORT_KEYS whitelist are accepted
    const allowedKeys = new Set<string>(EXPORT_KEYS);
    for (const [key, value] of Object.entries(data)) {
      // Skip metadata keys
      if (['timestamp', 'version', 'encrypted'].includes(key)) {
        continue;
      }

      // Security: Only import keys that are in the allowed whitelist
      if (!allowedKeys.has(key)) {
        errors.push(`Rejected unknown key "${key}" — not in allowed whitelist`);
        continue;
      }

      try {
        // Check if key exists
        const existing = localStorage.getItem(key);
        if (existing && !overwrite) {
          logger.debug(`Skipping existing key: ${key}`);
          continue;
        }

        // Convert value to JSON string if object
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
        imported++;
      } catch (error) {
        const err = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to import key "${key}": ${err}`);
        logger.error(`Failed to import key "${key}":`, error);
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  } catch (error) {
    logger.error('Import failed:', error);
    return {
      success: false,
      imported,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
};

/**
 * Download export data as JSON file
 * @param filename - Output filename (default: wallet-export-{timestamp}.json)
 * @param data - Optional pre-exported data (will call exportData if not provided)
 */
export const downloadJSON = (filename?: string, data?: ExportData): void => {
  try {
    const exportedData = data || exportData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const defaultFilename = `wallet-export-${timestamp}.json`;

    const blob = new Blob([JSON.stringify(exportedData, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || defaultFilename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    logger.debug(`Export downloaded: ${a.download}`);
  } catch (error) {
    logger.error('Download failed:', error);
    throw error;
  }
};

/**
 * Read JSON file from file input
 * @param file - File object from input
 * @returns Promise resolving to parsed ExportData
 */
export const readJSONFile = (file: File): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const data = JSON.parse(text) as ExportData;

        // Basic validation
        if (!data.version || !data.timestamp) {
          reject(new Error('Invalid export file format'));
          return;
        }

        resolve(data);
      } catch {
        reject(new Error('Failed to parse JSON file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Derive an AES-256-GCM key from a password using PBKDF2
 * @param password - User password
 * @param salt - Random salt (16 bytes)
 * @returns CryptoKey for AES-256-GCM
 */
const deriveExportKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 600000, // OWASP 2024 recommendation for PBKDF2-SHA256
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
};

/**
 * Encrypt export data using AES-256-GCM (Web Crypto API)
 * Format: base64( salt[16] || iv[12] || ciphertext || authTag[16] )
 * @param data - Data to encrypt
 * @param password - Encryption password
 * @returns Encrypted data as base64 string
 */
export const encryptData = async (data: ExportData, password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const json = JSON.stringify(data);
  const plaintext = encoder.encode(json);

  // Generate random salt and IV
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // Derive key from password
  const key = await deriveExportKey(password, salt);

  // Encrypt with AES-256-GCM (includes built-in authentication tag)
  const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

  // Combine: salt(16) + iv(12) + ciphertext+tag
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...combined));
};

/**
 * Decrypt AES-256-GCM encrypted data (Web Crypto API)
 * @param encryptedBase64 - Encrypted data as base64 string
 * @param password - Decryption password
 * @returns Decrypted ExportData
 */
export const decryptData = async (
  encryptedBase64: string,
  password: string,
): Promise<ExportData> => {
  try {
    // Decode base64
    const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

    // Extract salt (16 bytes), IV (12 bytes), and ciphertext+tag (rest)
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);

    // Derive decryption key
    const key = await deriveExportKey(password, salt);

    // Decrypt with AES-256-GCM (verifies authentication tag automatically)
    const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

    const decoder = new TextDecoder();
    const json = decoder.decode(decrypted);
    return JSON.parse(json) as ExportData;
  } catch {
    // Generic error to prevent oracle attacks — do not reveal why decryption failed
    throw new Error('Decryption failed - wrong password or corrupted data');
  }
};

/**
 * Download encrypted export data
 * @param password - Encryption password
 * @param filename - Output filename
 */
export const downloadEncrypted = async (password: string, filename?: string): Promise<void> => {
  const data = exportData();
  data.encrypted = true;

  const encrypted = await encryptData(data, password);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const defaultFilename = `wallet-backup-${timestamp}.enc`;

  const blob = new Blob([encrypted], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || defaultFilename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);

  logger.debug(`Encrypted backup downloaded: ${a.download}`);
};

/**
 * Read and decrypt encrypted file
 * @param file - Encrypted file
 * @param password - Decryption password
 * @returns Promise resolving to decrypted ExportData
 */
export const readEncryptedFile = (file: File, password: string): Promise<ExportData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const encrypted = event.target?.result as string;
        const data = await decryptData(encrypted, password);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};

/**
 * Clear all wallet data from localStorage
 * @param confirm - Safety confirmation (must be true)
 * @returns Success status
 */
export const clearAllData = (confirm: boolean = false): boolean => {
  if (!confirm) {
    logger.warn('clearAllData requires explicit confirmation');
    return false;
  }

  try {
    for (const key of EXPORT_KEYS) {
      localStorage.removeItem(key);
    }
    logger.debug('All wallet data cleared');
    return true;
  } catch (error) {
    logger.error('Failed to clear data:', error);
    return false;
  }
};

/**
 * Get storage usage statistics
 * @returns Storage usage information
 */
export const getStorageStats = (): {
  used: number;
  total: number;
  percentage: number;
  keys: Array<{ key: string; size: number }>;
} => {
  let totalSize = 0;
  const keysSizes: Array<{ key: string; size: number }> = [];

  for (const key of EXPORT_KEYS) {
    const value = localStorage.getItem(key);
    if (value) {
      const size = new Blob([value]).size;
      totalSize += size;
      keysSizes.push({ key, size });
    }
  }

  // Sort by size descending
  keysSizes.sort((a, b) => b.size - a.size);

  // Estimate total localStorage capacity (typically 5-10MB)
  const estimatedTotal = 5 * 1024 * 1024; // 5MB

  return {
    used: totalSize,
    total: estimatedTotal,
    percentage: (totalSize / estimatedTotal) * 100,
    keys: keysSizes,
  };
};

/**
 * Validate export data structure
 * @param data - Data to validate
 * @returns Validation result with errors
 */
export const validateExportData = (
  data: unknown,
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!data) {
    errors.push('Export data is null or undefined');
    return { valid: false, errors };
  }

  if (typeof data !== 'object') {
    errors.push('Export data must be an object');
    return { valid: false, errors };
  }

  const record = data as { version?: unknown; timestamp?: unknown; encrypted?: unknown; [key: string]: unknown };

  // Check required fields
  if (!record.version) {
    errors.push('Missing version field');
  }

  if (!record.timestamp) {
    errors.push('Missing timestamp field');
  }

  if (typeof record.encrypted !== 'boolean') {
    errors.push('Missing or invalid encrypted field');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Storage Exporter object with all methods
 */
export const storageExporter = {
  exportData,
  importData,
  downloadJSON,
  downloadEncrypted,
  readJSONFile,
  readEncryptedFile,
  encryptData,
  decryptData,
  clearAllData,
  getStorageStats,
  validateExportData,
  EXPORT_KEYS,
};

// ExportData type already exported above
