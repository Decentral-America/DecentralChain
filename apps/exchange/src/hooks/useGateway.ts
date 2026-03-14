/**
 * useGateway Hook
 * Provides access to GatewayService functionality with reactive state management
 * Integrates with ConfigContext for gateway configurations
 */
import { useState, useCallback, useMemo } from 'react';
import { useConfig } from '@/contexts/ConfigContext';
import { GatewayService } from '@/services/gateway/GatewayService';
import { formatGatewayError } from '@/services/gateway/utils';
import type { DepositDetails, WithdrawDetails, GatewayType } from '@/services/gateway/types';

interface UseGatewayReturn {
  getDepositDetails: (assetId: string, userAddress: string) => Promise<DepositDetails>;
  getWithdrawDetails: (assetId: string, targetAddress: string) => Promise<WithdrawDetails>;
  getDepositAddress: (assetId: string, userAddress: string) => Promise<string>;
  getRobinAddress: (
    assetId: string,
    userAddress: string,
    recaptcha: string
  ) => Promise<{ address: string; expiry: Date }>;
  hasSupportOf: (assetId: string, type: GatewayType) => boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Custom hook for gateway operations
 * Provides deposit/withdraw functionality with loading states and error handling
 * @returns Gateway operations and state
 */
export const useGateway = (): UseGatewayReturn => {
  const { wavesGateway } = useConfig();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize gatewayService instance to prevent recreation on every render
  const gatewayService = useMemo(
    () => new GatewayService(wavesGateway || {}),
    [wavesGateway]
  );

  /**
   * Get deposit details for an asset
   * @param assetId - Asset ID to deposit
   * @param userAddress - User's DecentralChain address
   * @returns Deposit details including gateway address and fees
   */
  const getDepositDetails = useCallback(
    async (assetId: string, userAddress: string): Promise<DepositDetails> => {
      setLoading(true);
      setError(null);
      try {
        const details = await gatewayService.getDepositDetails(assetId, userAddress);
        return details;
      } catch (err) {
        const errorMsg = formatGatewayError(err);
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gatewayService]
  );

  /**
   * Get withdraw details for an asset
   * @param assetId - Asset ID to withdraw
   * @param targetAddress - Target blockchain address (e.g., BTC address)
   * @returns Withdraw details including gateway address and attachment
   */
  const getWithdrawDetails = useCallback(
    async (assetId: string, targetAddress: string): Promise<WithdrawDetails> => {
      setLoading(true);
      setError(null);
      try {
        const details = await gatewayService.getWithdrawDetails(assetId, targetAddress);
        return details;
      } catch (err) {
        const errorMsg = formatGatewayError(err);
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gatewayService]
  );

  /**
   * Get static tunnel deposit address
   * @param assetId - Asset ID
   * @param userAddress - User's DecentralChain address
   * @returns Static deposit address on target blockchain
   */
  const getDepositAddress = useCallback(
    async (assetId: string, userAddress: string): Promise<string> => {
      setLoading(true);
      setError(null);
      try {
        const address = await gatewayService.getDepositAddress(assetId, userAddress);
        return address;
      } catch (err) {
        const errorMsg = formatGatewayError(err);
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gatewayService]
  );

  /**
   * Get round-robin temporary deposit address
   * @param assetId - Asset ID
   * @param userAddress - User's DecentralChain address
   * @param recaptcha - Recaptcha token
   * @returns Temporary address with expiry time
   */
  const getRobinAddress = useCallback(
    async (
      assetId: string,
      userAddress: string,
      recaptcha: string
    ): Promise<{ address: string; expiry: Date }> => {
      setLoading(true);
      setError(null);
      try {
        const result = await gatewayService.getRobinAddress(assetId, userAddress, recaptcha);
        return result;
      } catch (err) {
        const errorMsg = formatGatewayError(err);
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [gatewayService]
  );

  /**
   * Check if gateway supports an operation for an asset
   * @param assetId - Asset ID to check
   * @param type - Operation type ('deposit' or 'withdraw')
   * @returns True if gateway supports the operation
   */
  const hasSupportOf = useCallback(
    (assetId: string, type: GatewayType): boolean => {
      return gatewayService.hasSupportOf(assetId, type);
    },
    [gatewayService]
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    getDepositDetails,
    getWithdrawDetails,
    getDepositAddress,
    getRobinAddress,
    hasSupportOf,
    loading,
    error,
    clearError,
  };
};
