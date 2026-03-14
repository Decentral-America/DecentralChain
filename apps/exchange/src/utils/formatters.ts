// Formatting utility functions

/**
 * Custom JSON stringifier that handles BigNumber and other special types
 * This replicates the Angular WavesApp.stringifyJSON functionality
 */
export const stringifyJSON = (data: any, replacer?: any, space?: string | number): string => {
  return JSON.stringify(
    data,
    (key, value) => {
      // Handle BigNumber-like objects that have a toFixed method
      if (value && typeof value === 'object' && typeof value.toFixed === 'function') {
        return value.toFixed();
      }
      // Handle custom replacer if provided
      if (replacer && typeof replacer === 'function') {
        return replacer(key, value);
      }
      return value;
    },
    space
  );
};

/**
 * Format DCC amount with specified decimal places
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 8)
 * @returns Formatted string with thousands separators
 */
export const formatDcc = (value: number, decimals: number = 8): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format a general amount with specified decimal places
 * @param value - The numeric value to format
 * @param maximumFractionDigits - Maximum number of decimal places (default: 8)
 * @returns Formatted string with thousands separators
 */
export const formatAmount = (value: number, maximumFractionDigits: number = 8): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value);
};

/**
 * Shorten an address to show first 6 and last 4 characters
 * @param address - The full address to shorten
 * @returns Shortened address with ellipsis in the middle
 */
export const shortenAddress = (address: string): string => {
  if (!address || address.length <= 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

/**
 * Convert various timestamp formats to Unix timestamp in milliseconds
 * @param timestamp - Timestamp as number, string, or Date
 * @returns Unix timestamp in milliseconds
 */
export const toTimestamp = (timestamp: number | string | Date): number => {
  if (timestamp instanceof Date) {
    return timestamp.getTime();
  }
  if (typeof timestamp === 'string') {
    return new Date(timestamp).getTime();
  }
  // If already a number, assume it's in milliseconds or seconds
  // Blockchain timestamps are typically in milliseconds
  return timestamp;
};
