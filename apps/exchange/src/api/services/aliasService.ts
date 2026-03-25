/**
 * Alias Service
 * Handles alias-related API calls
 */
import * as ds from 'data-service';
import { logger } from '@/lib/logger';

export interface AliasInfo {
  alias: string;
  address: string;
}

/**
 * Check if an alias already exists
 * Uses data-service API for better reliability (matches Angular implementation)
 * @param alias - The alias to check (without 'alias:D:' prefix)
 * @returns Promise<boolean> - true if alias exists, false otherwise
 */
export const checkAliasExists = async (alias: string): Promise<boolean> => {
  try {
    const result = await ds.api.aliases.getAddressByAlias(alias);
    return !!result?.address;
  } catch {
    // If alias doesn't exist, data-service will throw an error or return null
    return false;
  }
};

/**
 * Get address by alias
 * Uses data-service API for better reliability (matches Angular implementation)
 * @param alias - The alias to look up (without 'alias:D:' prefix)
 * @returns Promise<string> - The address associated with the alias
 */
export const getAddressByAlias = async (alias: string): Promise<string> => {
  try {
    logger.debug(`[aliasService] Attempting to resolve alias: "${alias}"`);

    // Use data-service API (same as Angular) for better indexing and reliability
    const result = await ds.api.aliases.getAddressByAlias(alias);

    logger.debug(`[aliasService] Successfully resolved alias "${alias}" to:`, result);

    if (!result?.address) {
      throw new Error(`Alias "${alias}" resolved but no address returned`);
    }

    return result.address;
  } catch (error: unknown) {
    logger.error(`[aliasService] Failed to resolve alias "${alias}":`, error);

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : `Alias "${alias}" not found`;

    throw new Error(errorMessage);
  }
};

/**
 * Get all aliases for an address
 * Uses data-service API for better reliability (matches Angular implementation)
 * @param address - The address to get aliases for
 * @returns Promise<string[]> - Array of aliases
 */
export const getAliasesByAddress = async (address: string): Promise<string[]> => {
  try {
    // Use data-service API (same as Angular) for better indexing
    // This is more reliable than the node API which returns 404 for new addresses
    const aliases = await ds.api.aliases.getAliasesByAddress(address);
    return aliases || [];
  } catch (error: unknown) {
    logger.error('Error fetching aliases:', error);
    return [];
  }
};

/**
 * Validate alias format
 * Rules:
 * - Length: 4-30 characters
 * - Only lowercase letters, numbers, and special chars: -@_.
 */
export const validateAliasFormat = (
  alias: string,
): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (!alias) {
    errors.push('Alias is required');
    return { errors, valid: false };
  }

  const MIN_LENGTH = 4;
  const MAX_LENGTH = 30;
  const ALIAS_PATTERN = /^[a-z0-9-@_.]*$/;

  if (alias.length < MIN_LENGTH) {
    errors.push(`Alias must be at least ${MIN_LENGTH} characters`);
  }

  if (alias.length > MAX_LENGTH) {
    errors.push(`Alias must be at most ${MAX_LENGTH} characters`);
  }

  if (!ALIAS_PATTERN.test(alias)) {
    errors.push('Alias can only contain lowercase letters, numbers, and -@_.');
  }

  return {
    errors,
    valid: errors.length === 0,
  };
};
