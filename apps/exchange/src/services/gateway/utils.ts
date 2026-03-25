/**
 * Gateway Service Utility Functions
 * Utilities for address validation, config retrieval, and error formatting
 */

import { logger } from '@/lib/logger';
import { type GatewayConfig } from './types';

/**
 * Validates an external blockchain address using gateway regex pattern
 * @param address - The address to validate (e.g., BTC address)
 * @param assetId - The asset ID to get validation rules for
 * @param gatewayConfig - Gateway configuration from network config
 * @returns true if address is valid, false otherwise
 */
export const validateGatewayAddress = (
  address: string,
  assetId: string,
  gatewayConfig: Record<string, GatewayConfig>,
): boolean => {
  // Handle empty or missing inputs
  if (!address || !assetId) {
    return false;
  }

  const config = gatewayConfig[assetId];
  if (!config?.regex) {
    logger.warn(`No gateway configuration found for asset ${assetId}`);
    return false;
  }

  try {
    const regex = new RegExp(config.regex);
    return regex.test(address);
  } catch (error) {
    logger.error('Invalid regex pattern:', error);
    return false;
  }
};

/**
 * Retrieves gateway configuration for a specific asset
 * @param assetId - The asset ID to get config for
 * @param gatewayConfigs - Gateway configurations from network config
 * @returns Gateway config or null if not found
 */
export const getGatewayConfig = (
  assetId: string,
  gatewayConfigs: Record<string, GatewayConfig>,
): GatewayConfig | null => {
  return gatewayConfigs[assetId] || null;
};

/**
 * Formats gateway API errors into user-friendly messages
 * @param error - Error object from API call
 * @returns Formatted error message
 */
export const formatGatewayError = (error: unknown): string => {
  // Check for API response error message
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const resp = (error as { response?: { data?: { message?: string } } }).response;
    if (resp?.data?.message) {
      return resp.data.message;
    }
  }

  // Check for standard error message
  if (error instanceof Error) {
    return error.message;
  }

  // Default fallback message
  return 'Gateway service unavailable';
};

/**
 * Gets a user-friendly hint for the expected address format
 * @param regex - The regex pattern string
 * @returns Human-readable format hint
 */
export const getAddressFormatHint = (regex: string): string => {
  // BTC address formats
  if (regex.includes('bc1') && regex.includes('[13]')) {
    return 'Bitcoin address (bc1..., 1..., or 3...)';
  }
  if (regex.includes('bc1')) {
    return 'Bitcoin SegWit address (bc1...)';
  }
  if (regex.includes('[13]')) {
    return 'Bitcoin Legacy address (1... or 3...)';
  }

  // Generic fallback
  return 'Valid blockchain address';
};
