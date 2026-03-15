/**
 * useGatewayTransaction Hook
 * Handles building and broadcasting gateway withdrawal transactions
 * Integrates with existing transaction signing and broadcasting infrastructure
 */

import { type BigNumber } from '@decentralchain/bignumber';
import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';

interface WithdrawParams {
  /** Asset ID to withdraw */
  assetId: string;
  /** Amount in token units (with decimals) */
  amount: BigNumber;
  /** External blockchain address (e.g., BTC address) */
  targetAddress: string;
  /** Gateway's DecentralChain address */
  gatewayAddress: string;
  /** Attachment string (will be base64-encoded) */
  attachment: string;
}

interface UseGatewayTransactionReturn {
  /** Execute withdrawal transaction */
  withdraw: (params: WithdrawParams) => Promise<string>;
  /** Whether transaction is being processed */
  loading: boolean;
  /** Error message if transaction fails */
  error: string | null;
  /** Transaction ID after successful broadcast */
  txId: string | null;
  /** Clear error state */
  clearError: () => void;
}

/**
 * Hook for gateway withdrawal transactions
 * Builds Transfer transaction with target address in attachment field
 */
export const useGatewayTransaction = (): UseGatewayTransactionReturn => {
  const { user } = useAuth();
  const { signTransfer } = useTransactionSigning();
  const { broadcastAsync } = useBroadcast({
    showToast: true,
    waitForConfirmation: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  /**
   * Build and broadcast withdrawal transaction
   * @param params Withdrawal parameters
   * @returns Transaction ID
   */
  const withdraw = useCallback(
    async (params: WithdrawParams): Promise<string> => {
      if (!user?.address) {
        throw new Error('User not authenticated');
      }

      setLoading(true);
      setError(null);
      setTxId(null);

      try {
        // Encode target address as base64 for attachment
        const attachmentBase64 = Buffer.from(params.attachment, 'utf8').toString('base64');

        // Build transfer transaction parameters
        const transferParams = {
          amount: params.amount.toFixed(), // Convert BigNumber to string
          assetId: params.assetId === 'DCC' ? null : params.assetId, // null for DCC
          attachment: attachmentBase64,
          fee: 100000, // 0.001 DCC in satoshis
          recipient: params.gatewayAddress,
          timestamp: Date.now(),
        };

        // Sign transaction
        // Note: useTransactionSigning handles Ledger, seed, privateKey automatically
        const signedTx = await signTransfer(transferParams);

        // Broadcast transaction
        const result = await broadcastAsync(signedTx);

        setTxId(result.id);
        return result.id;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : 'Gateway withdrawal transaction failed';
        setError(errorMsg);
        throw new Error(errorMsg);
      } finally {
        setLoading(false);
      }
    },
    [user, signTransfer, broadcastAsync],
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    clearError,
    error,
    loading,
    txId,
    withdraw,
  };
};
