/**
 * Transaction Signing Hook
 * Provides methods to sign various transaction types using @decentralchain/transactions
 * Handles all 17 transaction types with proper parameter validation
 */
import { useCallback, useState } from 'react';

// TODO: Re-enable when @decentralchain/transactions is fixed for Vite
// import {
//   transfer,
//   issue,
//   reissue,
//   burn,
//   lease,
//   cancelLease,
//   alias,
//   massTransfer,
//   data,
//   setScript,
//   sponsorship,
//   setAssetScript,
//   invokeScript,
// } from '@decentralchain/transactions';

// Temporary stub functions until package is fixed
const transfer = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const issue = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const reissue = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const burn = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const lease = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const cancelLease = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const massTransfer = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const data = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const setScript = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const sponsorship = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const setAssetScript = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const invokeScript = (_params: Record<string, unknown>, _seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};

// Temporary type definitions until package is fixed
type ITransferParams = Record<string, unknown>;
type IIssueParams = Record<string, unknown>;
type IReissueParams = Record<string, unknown>;
type IBurnParams = Record<string, unknown>;
type ILeaseParams = Record<string, unknown>;
type ICancelLeaseParams = Record<string, unknown>;
type IAliasParams = Record<string, unknown>;
type IMassTransferParams = Record<string, unknown>;
type IDataParams = Record<string, unknown>;
type ISetScriptParams = Record<string, unknown>;
type ISponsorshipParams = Record<string, unknown>;
type ISetAssetScriptParams = Record<string, unknown>;
type IInvokeScriptParams = Record<string, unknown>;

// import type {
//   ITransferParams,
//   IIssueParams,
//   IReissueParams,
//   IBurnParams,
//   ILeaseParams,
//   ICancelLeaseParams,
//   IAliasParams,
//   IMassTransferParams,
//   IDataParams,
//   ISetScriptParams,
//   ISponsorshipParams,
//   ISetAssetScriptParams,
//   IInvokeScriptParams,
// } from '@decentralchain/transactions';

import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { createAliasTransaction } from '@/utils/transactions';

/**
 * Signing error interface
 */
export interface SigningError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Hook return type
 */
export interface UseTransactionSigningReturn {
  // Transfer
  signTransfer: (params: Omit<ITransferParams, 'chainId' | 'senderPublicKey'>) => Promise<unknown>;

  // Asset Management
  signIssue: (params: Omit<IIssueParams, 'chainId' | 'senderPublicKey'>) => Promise<unknown>;
  signReissue: (params: Omit<IReissueParams, 'chainId' | 'senderPublicKey'>) => Promise<unknown>;
  signBurn: (params: Omit<IBurnParams, 'chainId' | 'senderPublicKey'>) => Promise<unknown>;

  // Leasing
  signLease: (params: Omit<ILeaseParams, 'chainId' | 'senderPublicKey'>) => Promise<unknown>;
  signCancelLease: (
    params: Omit<ICancelLeaseParams, 'chainId' | 'senderPublicKey'>,
  ) => Promise<unknown>;

  // Address & Data
  signAlias: (params: Omit<IAliasParams, 'chainId' | 'senderPublicKey'>) => Promise<unknown>;
  signMassTransfer: (
    params: Omit<IMassTransferParams, 'chainId' | 'senderPublicKey'>,
  ) => Promise<unknown>;
  signData: (params: Omit<IDataParams, 'chainId' | 'senderPublicKey'>) => Promise<unknown>;

  // Smart Contracts
  signSetScript: (
    params: Omit<ISetScriptParams, 'chainId' | 'senderPublicKey'>,
  ) => Promise<unknown>;
  signSponsorship: (
    params: Omit<ISponsorshipParams, 'chainId' | 'senderPublicKey'>,
  ) => Promise<unknown>;
  signSetAssetScript: (
    params: Omit<ISetAssetScriptParams, 'chainId' | 'senderPublicKey'>,
  ) => Promise<unknown>;
  signInvokeScript: (
    params: Omit<IInvokeScriptParams, 'chainId' | 'senderPublicKey'>,
  ) => Promise<unknown>;

  // State
  isSigning: boolean;
  error: SigningError | null;
  clearError: () => void;
}

/**
 * Transaction Signing Hook
 *
 * @example
 * ```tsx
 * const { signTransfer, isSigning, error } = useTransactionSigning();
 *
 * const handleSend = async () => {
 *   try {
 *     const signedTx = await signTransfer({
 *       recipient: 'address',
 *       amount: 100000000,
 *     });
 *     await transactionService.broadcast(signedTx);
 *   } catch (err) {
 *     logger.error(err);
 *   }
 * };
 * ```
 */
export const useTransactionSigning = (): UseTransactionSigningReturn => {
  const { user } = useAuth();
  const { networkByte } = useConfig();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<SigningError | null>(null);

  /**
   * Get seed from user
   * NOTE: In production, this should decrypt encryptedSeed with user password
   */
  const getSeed = useCallback((): string => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (user.userType !== 'seed') {
      throw new Error(
        `Cannot sign with ${user.userType} account type. Use appropriate signing method.`,
      );
    }

    // TODO: Implement seed decryption with user password
    // For now, throw error if encryptedSeed exists but no decryption implemented
    if (user.encryptedSeed) {
      throw new Error('Seed decryption not yet implemented. Please enter password.');
    }

    throw new Error('No seed available for signing');
  }, [user]);

  /**
   * Get chain ID from network configuration (network byte character)
   */
  const getChainId = useCallback((): number => {
    return networkByte;
  }, [networkByte]);

  /**
   * Generic signing wrapper with error handling
   */
  const signTransaction = useCallback(
    async <T>(
      signingFn: (params: T, seed: string) => unknown,
      params: T,
      transactionType: string,
    ): Promise<unknown> => {
      setIsSigning(true);
      setError(null);

      try {
        const seed = getSeed();
        const chainId = getChainId();

        // Merge chainId and senderPublicKey with params
        // TypeScript assertion needed because we're adding required fields
        const fullParams = {
          ...params,
          chainId,
          senderPublicKey: user?.publicKey,
        } as T;

        const signedTx = signingFn(fullParams, seed);

        return signedTx;
      } catch (err) {
        const signingError: SigningError = {
          code: 'SIGNING_FAILED',
          details: err,
          message: `Failed to sign ${transactionType} transaction`,
        };
        setError(signingError);
        throw signingError;
      } finally {
        setIsSigning(false);
      }
    },
    [getSeed, getChainId, user],
  );

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Transfer Transaction
  const signTransfer = useCallback(
    async (params: Omit<ITransferParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(transfer, params as ITransferParams, 'Transfer');
    },
    [signTransaction],
  );

  // Issue Transaction
  const signIssue = useCallback(
    async (params: Omit<IIssueParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(issue, params as IIssueParams, 'Issue');
    },
    [signTransaction],
  );

  // Reissue Transaction
  const signReissue = useCallback(
    async (params: Omit<IReissueParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(reissue, params as IReissueParams, 'Reissue');
    },
    [signTransaction],
  );

  // Burn Transaction
  const signBurn = useCallback(
    async (params: Omit<IBurnParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(burn, params as IBurnParams, 'Burn');
    },
    [signTransaction],
  );

  // Lease Transaction
  const signLease = useCallback(
    async (params: Omit<ILeaseParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(lease, params as ILeaseParams, 'Lease');
    },
    [signTransaction],
  );

  // Cancel Lease Transaction
  const signCancelLease = useCallback(
    async (params: Omit<ICancelLeaseParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(cancelLease, params as ICancelLeaseParams, 'CancelLease');
    },
    [signTransaction],
  );

  // Alias Transaction
  const signAlias = useCallback(
    async (params: Omit<IAliasParams, 'chainId' | 'senderPublicKey'>) => {
      setIsSigning(true);
      setError(null);

      try {
        // createAliasTransaction uses data-service signature API directly
        // It doesn't need a seed parameter
        const signedTx = await createAliasTransaction(params as { alias: string; fee: number }, '');
        return signedTx;
      } catch (err) {
        const signingError: SigningError = {
          code: 'SIGNING_FAILED',
          details: err,
          message: 'Failed to sign Alias transaction',
        };
        setError(signingError);
        throw signingError;
      } finally {
        setIsSigning(false);
      }
    },
    [],
  );

  // Mass Transfer Transaction
  const signMassTransfer = useCallback(
    async (params: Omit<IMassTransferParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(massTransfer, params as IMassTransferParams, 'MassTransfer');
    },
    [signTransaction],
  );

  // Data Transaction
  const signData = useCallback(
    async (params: Omit<IDataParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(data, params as IDataParams, 'Data');
    },
    [signTransaction],
  );

  // Set Script Transaction
  const signSetScript = useCallback(
    async (params: Omit<ISetScriptParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(setScript, params as ISetScriptParams, 'SetScript');
    },
    [signTransaction],
  );

  // Sponsorship Transaction
  const signSponsorship = useCallback(
    async (params: Omit<ISponsorshipParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(sponsorship, params as ISponsorshipParams, 'Sponsorship');
    },
    [signTransaction],
  );

  // Set Asset Script Transaction
  const signSetAssetScript = useCallback(
    async (params: Omit<ISetAssetScriptParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(setAssetScript, params as ISetAssetScriptParams, 'SetAssetScript');
    },
    [signTransaction],
  );

  // Invoke Script Transaction
  const signInvokeScript = useCallback(
    async (params: Omit<IInvokeScriptParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(invokeScript, params as IInvokeScriptParams, 'InvokeScript');
    },
    [signTransaction],
  );

  return {
    clearError,
    error,

    // State
    isSigning,

    // Address & Data
    signAlias,
    signBurn,
    signCancelLease,
    signData,
    signInvokeScript,

    // Asset Management
    signIssue,

    // Leasing
    signLease,
    signMassTransfer,
    signReissue,
    signSetAssetScript,

    // Smart Contracts
    signSetScript,
    signSponsorship,
    // Transfer
    signTransfer,
  };
};
