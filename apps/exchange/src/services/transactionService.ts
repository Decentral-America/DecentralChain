/**
 * Transaction Service
 * Handles transaction fetching, broadcasting, and utilities
 */
import { broadcast } from 'data-service';
import { nodeClient } from '@/api/client';
import { logger } from '@/lib/logger';

/**
 * Transaction Type Enum
 */
export enum TransactionType {
  Genesis = 1,
  Payment = 2,
  Issue = 3,
  Transfer = 4,
  Reissue = 5,
  Burn = 6,
  Exchange = 7,
  Lease = 8,
  LeaseCancel = 9,
  Alias = 10,
  MassTransfer = 11,
  Data = 12,
  SetScript = 13,
  Sponsorship = 14,
  SetAssetScript = 15,
  InvokeScript = 16,
  UpdateAssetInfo = 17,
}

/**
 * Transaction Status
 */
export type TransactionStatus = 'confirmed' | 'unconfirmed' | 'failed';

/**
 * Base Transaction Interface
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  timestamp: number;
  sender: string;
  senderPublicKey: string;
  fee: number;
  feeAssetId?: string;
  proofs: string[];
  height?: number;
  applicationStatus?: 'succeeded' | 'script_execution_failed';
}

/**
 * Transfer Transaction
 */
export interface TransferTransaction extends Transaction {
  type: TransactionType.Transfer;
  recipient: string;
  assetId?: string;
  amount: number;
  attachment?: string;
}

/**
 * Transaction History Response
 */
export interface TransactionHistory {
  transactions: Transaction[];
  hasMore: boolean;
}

/**
 * Broadcast Result
 */
export interface BroadcastResult {
  id: string;
  timestamp: number;
  status: 'success' | 'error';
  error?: string;
}

/**
 * Transaction Service
 */
export const transactionService = {
  /**
   * Broadcast a signed transaction
   * @param signedTx - Signed transaction object
   * @param nodeUrl - Optional custom node URL
   */
  broadcast: async (signedTx: unknown, _nodeUrl?: string): Promise<BroadcastResult> => {
    try {
      // Note: broadcast function from data-service only takes signedTx
      // nodeUrl is managed via data-service config, not passed directly
      const result = (await broadcast(signedTx)) as {
        id: string;
        timestamp: number;
      };

      return {
        id: result.id,
        status: 'success',
        timestamp: result.timestamp,
      };
    } catch (error: unknown) {
      logger.error('Failed to broadcast transaction:', error);

      // Extract user-friendly error message
      let errorMessage = 'Unknown error';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      // Check for alias-specific errors
      if (
        errorMessage.toLowerCase().includes('alias') &&
        errorMessage.toLowerCase().includes('already')
      ) {
        errorMessage = 'Alias already claimed';
      }

      // Throw the error instead of returning error status
      // This ensures proper error handling in the calling code
      throw new Error(errorMessage);
    }
  },

  /**
   * Calculate transaction fee
   * @param txType - Transaction type
   * @param extraData - Additional data for fee calculation (e.g., data entries count)
   */
  calculateFee: (txType: TransactionType, extraData?: { dataEntries?: number }): number => {
    // Base fees in wavelets (1 DCC = 100,000,000 wavelets)
    const baseFees: Record<TransactionType, number> = {
      [TransactionType.Genesis]: 0,
      [TransactionType.Payment]: 100000,
      [TransactionType.Issue]: 100000000, // 1 DCC
      [TransactionType.Transfer]: 100000,
      [TransactionType.Reissue]: 100000000,
      [TransactionType.Burn]: 100000,
      [TransactionType.Exchange]: 300000,
      [TransactionType.Lease]: 100000,
      [TransactionType.LeaseCancel]: 100000,
      [TransactionType.Alias]: 100000,
      [TransactionType.MassTransfer]: 100000, // + 50000 per transfer
      [TransactionType.Data]: 100000, // + per kb
      [TransactionType.SetScript]: 1000000, // 0.01 DCC
      [TransactionType.Sponsorship]: 100000000,
      [TransactionType.SetAssetScript]: 100000000,
      [TransactionType.InvokeScript]: 500000,
      [TransactionType.UpdateAssetInfo]: 100000,
    };

    let fee = baseFees[txType] || 100000;

    // Add extra fees for data transactions
    if (txType === TransactionType.Data && extraData?.dataEntries) {
      fee += Math.ceil(extraData.dataEntries / 100) * 100000;
    }

    return fee;
  },

  /**
   * Format transaction for display
   * @param tx - Transaction
   */
  formatTransaction: (tx: Transaction): string => {
    const type = transactionService.getTypeName(tx.type);
    const date = new Date(tx.timestamp).toLocaleString();
    const fee = (tx.fee / 100000000).toFixed(8);

    return `${type} | ${date} | Fee: ${fee} DCC`;
  },

  /**
   * Get transaction by ID
   * @param txId - Transaction ID
   */
  getById: async (txId: string): Promise<Transaction> => {
    try {
      const { data } = await nodeClient.get<Transaction>(`/transactions/info/${txId}`);
      return data;
    } catch {
      logger.error('Failed to fetch transaction');
      throw new Error('Failed to fetch transaction');
    }
  },
  /**
   * Get transaction history for an address
   * @param address - DCC address
   * @param limit - Number of transactions to fetch (default: 100)
   */
  getHistory: async (address: string, limit = 100): Promise<Transaction[]> => {
    try {
      const { data } = await nodeClient.get<Transaction[][]>(
        `/transactions/address/${address}/limit/${limit}`,
      );
      // API returns array of arrays, take first element
      return data[0] || [];
    } catch (error) {
      logger.error('Failed to fetch transaction history:', error);
      throw error;
    }
  },

  /**
   * Get transaction status
   * @param txId - Transaction ID
   */
  getStatus: async (txId: string): Promise<TransactionStatus> => {
    try {
      const tx = await transactionService.getById(txId);
      if (tx.height && tx.height > 0) {
        return tx.applicationStatus === 'script_execution_failed' ? 'failed' : 'confirmed';
      }
      return 'unconfirmed';
    } catch {
      // If transaction not found in confirmed or unconfirmed, it may have failed
      return 'failed';
    }
  },

  /**
   * Get transaction type name
   * @param type - Transaction type number
   */
  getTypeName: (type: TransactionType): string => {
    const typeNames: Record<TransactionType, string> = {
      [TransactionType.Genesis]: 'Genesis',
      [TransactionType.Payment]: 'Payment',
      [TransactionType.Issue]: 'Issue',
      [TransactionType.Transfer]: 'Transfer',
      [TransactionType.Reissue]: 'Reissue',
      [TransactionType.Burn]: 'Burn',
      [TransactionType.Exchange]: 'Exchange',
      [TransactionType.Lease]: 'Lease',
      [TransactionType.LeaseCancel]: 'Lease Cancel',
      [TransactionType.Alias]: 'Create Alias',
      [TransactionType.MassTransfer]: 'Mass Transfer',
      [TransactionType.Data]: 'Data',
      [TransactionType.SetScript]: 'Set Script',
      [TransactionType.Sponsorship]: 'Sponsorship',
      [TransactionType.SetAssetScript]: 'Set Asset Script',
      [TransactionType.InvokeScript]: 'Invoke Script',
      [TransactionType.UpdateAssetInfo]: 'Update Asset Info',
    };

    return typeNames[type] || 'Unknown';
  },

  /**
   * Get unconfirmed transactions
   */
  getUnconfirmed: async (): Promise<Transaction[]> => {
    try {
      const { data } = await nodeClient.get<Transaction[]>('/transactions/unconfirmed');
      return data;
    } catch (error) {
      logger.error('Failed to fetch unconfirmed transactions:', error);
      throw error;
    }
  },

  /**
   * Validate transaction signature
   * @param tx - Transaction to validate
   */
  validateSignature: (tx: Transaction): boolean => {
    // Basic validation - check if transaction has required fields
    return !!(tx.id && tx.proofs && tx.proofs.length > 0 && tx.senderPublicKey);
  },

  /**
   * Wait for transaction confirmation
   * @param txId - Transaction ID
   * @param timeout - Timeout in milliseconds (default: 60000)
   * @param interval - Poll interval in milliseconds (default: 1000)
   */
  waitForConfirmation: async (
    txId: string,
    timeout = 60000,
    interval = 1000,
  ): Promise<Transaction> => {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const tx = await transactionService.getById(txId);
        if (tx.height && tx.height > 0) {
          if (tx.applicationStatus === 'script_execution_failed') {
            throw new Error('Transaction execution failed');
          }
          return tx;
        }
      } catch {
        // Transaction not found yet, continue polling
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error('Transaction confirmation timeout');
  },
};

/**
 * Utility: Convert wavelets to DCC coins
 * @param wavelets - Amount in wavelets (smallest unit)
 */
export const waveletsToCoins = (wavelets: number): number => {
  return wavelets / 100000000;
};

/**
 * Utility: Convert DCC coins to wavelets
 * @param coins - Amount in DCC
 */
export const coinsToWavelets = (coins: number): number => {
  return Math.round(coins * 100000000);
};
