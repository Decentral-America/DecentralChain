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
  accounts: any[];

  /**
   * Application settings
   */
  settings: any;

  /**
   * Multi-account data
   */
  multiAccountData?: any;

  /**
   * User list
   */
  userList?: any[];

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
  const data: Record<string, any> = {};

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
      console.error(`Failed to export key "${key}":`, error);
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
  overwrite: boolean = true
): { success: boolean; imported: number; errors: string[] } => {
  let imported = 0;
  const errors: string[] = [];

  try {
    // Validate version
    if (!data.version || data.version !== '1.0.0') {
      console.warn('Import data version mismatch:', data.version);
    }

    // Import each key
    for (const [key, value] of Object.entries(data)) {
      // Skip metadata keys
      if (['timestamp', 'version', 'encrypted'].includes(key)) {
        continue;
      }

      try {
        // Check if key exists
        const existing = localStorage.getItem(key);
        if (existing && !overwrite) {
          console.log(`Skipping existing key: ${key}`);
          continue;
        }

        // Convert value to JSON string if object
        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        localStorage.setItem(key, stringValue);
        imported++;
      } catch (error) {
        const err = error instanceof Error ? error.message : String(error);
        errors.push(`Failed to import key "${key}": ${err}`);
        console.error(`Failed to import key "${key}":`, error);
      }
    }

    return {
      success: errors.length === 0,
      imported,
      errors,
    };
  } catch (error) {
    console.error('Import failed:', error);
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

    console.log(`Export downloaded: ${a.download}`);
  } catch (error) {
    console.error('Download failed:', error);
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
      } catch (error) {
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
 * Simple XOR encryption for export data
 * @param data - Data to encrypt
 * @param password - Encryption password
 * @returns Encrypted data as base64 string
 */
export const encryptData = (data: ExportData, password: string): string => {
  const json = JSON.stringify(data);
  const encrypted: number[] = [];

  // Simple XOR encryption (for demonstration - use crypto library in production)
  for (let i = 0; i < json.length; i++) {
    const charCode = json.charCodeAt(i);
    const keyChar = password.charCodeAt(i % password.length);
    encrypted.push(charCode ^ keyChar);
  }

  // Convert to base64
  const bytes = new Uint8Array(encrypted);
  return btoa(String.fromCharCode(...bytes));
};

/**
 * Decrypt XOR encrypted data
 * @param encryptedBase64 - Encrypted data as base64 string
 * @param password - Decryption password
 * @returns Decrypted ExportData
 */
export const decryptData = (encryptedBase64: string, password: string): ExportData => {
  try {
    // Decode base64
    const binaryString = atob(encryptedBase64);
    const encrypted = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      encrypted[i] = binaryString.charCodeAt(i);
    }

    // Decrypt with XOR
    const decrypted: string[] = [];
    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted[i];
      const keyChar = password.charCodeAt(i % password.length);
      decrypted.push(String.fromCharCode(charCode ^ keyChar));
    }

    const json = decrypted.join('');
    return JSON.parse(json) as ExportData;
  } catch (error) {
    throw new Error('Decryption failed - wrong password or corrupted data');
  }
};

/**
 * Download encrypted export data
 * @param password - Encryption password
 * @param filename - Output filename
 */
export const downloadEncrypted = (password: string, filename?: string): void => {
  const data = exportData();
  data.encrypted = true;

  const encrypted = encryptData(data, password);
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

  console.log(`Encrypted backup downloaded: ${a.download}`);
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

    reader.onload = (event) => {
      try {
        const encrypted = event.target?.result as string;
        const data = decryptData(encrypted, password);
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
    console.warn('clearAllData requires explicit confirmation');
    return false;
  }

  try {
    for (const key of EXPORT_KEYS) {
      localStorage.removeItem(key);
    }
    console.log('All wallet data cleared');
    return true;
  } catch (error) {
    console.error('Failed to clear data:', error);
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
  data: any
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

  // Check required fields
  if (!data.version) {
    errors.push('Missing version field');
  }

  if (!data.timestamp) {
    errors.push('Missing timestamp field');
  }

  if (typeof data.encrypted !== 'boolean') {
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
