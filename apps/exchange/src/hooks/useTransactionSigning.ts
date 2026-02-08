/**
 * Transaction Signing Hook
 * Provides methods to sign various transaction types using @decentralchain/waves-transactions
 * Handles all 17 transaction types with proper parameter validation
 */
import { useState, useCallback } from 'react';

// TODO: Re-enable when @decentralchain/waves-transactions is fixed for Vite
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
// } from '@decentralchain/waves-transactions';

// Temporary stub functions until package is fixed
const transfer = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const issue = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const reissue = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const burn = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const lease = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const cancelLease = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const massTransfer = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const data = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const setScript = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const sponsorship = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const setAssetScript = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};
const invokeScript = (params: any, seed: string) => {
  throw new Error('Not implemented - awaiting package fix');
};

// Temporary type definitions until package is fixed
type ITransferParams = any;
type IIssueParams = any;
type IReissueParams = any;
type IBurnParams = any;
type ILeaseParams = any;
type ICancelLeaseParams = any;
type IAliasParams = any;
type IMassTransferParams = any;
type IDataParams = any;
type ISetScriptParams = any;
type ISponsorshipParams = any;
type ISetAssetScriptParams = any;
type IInvokeScriptParams = any;

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
// } from '@decentralchain/waves-transactions';

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
  signTransfer: (params: Omit<ITransferParams, 'chainId' | 'senderPublicKey'>) => Promise<any>;

  // Asset Management
  signIssue: (params: Omit<IIssueParams, 'chainId' | 'senderPublicKey'>) => Promise<any>;
  signReissue: (params: Omit<IReissueParams, 'chainId' | 'senderPublicKey'>) => Promise<any>;
  signBurn: (params: Omit<IBurnParams, 'chainId' | 'senderPublicKey'>) => Promise<any>;

  // Leasing
  signLease: (params: Omit<ILeaseParams, 'chainId' | 'senderPublicKey'>) => Promise<any>;
  signCancelLease: (
    params: Omit<ICancelLeaseParams, 'chainId' | 'senderPublicKey'>
  ) => Promise<any>;

  // Address & Data
  signAlias: (params: Omit<IAliasParams, 'chainId' | 'senderPublicKey'>) => Promise<any>;
  signMassTransfer: (
    params: Omit<IMassTransferParams, 'chainId' | 'senderPublicKey'>
  ) => Promise<any>;
  signData: (params: Omit<IDataParams, 'chainId' | 'senderPublicKey'>) => Promise<any>;

  // Smart Contracts
  signSetScript: (params: Omit<ISetScriptParams, 'chainId' | 'senderPublicKey'>) => Promise<any>;
  signSponsorship: (
    params: Omit<ISponsorshipParams, 'chainId' | 'senderPublicKey'>
  ) => Promise<any>;
  signSetAssetScript: (
    params: Omit<ISetAssetScriptParams, 'chainId' | 'senderPublicKey'>
  ) => Promise<any>;
  signInvokeScript: (
    params: Omit<IInvokeScriptParams, 'chainId' | 'senderPublicKey'>
  ) => Promise<any>;

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
 *     console.error(err);
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
        `Cannot sign with ${user.userType} account type. Use appropriate signing method.`
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
      signingFn: (params: T, seed: string) => any,
      params: T,
      transactionType: string
    ): Promise<any> => {
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
        } as any;

        const signedTx = signingFn(fullParams, seed);

        return signedTx;
      } catch (err) {
        const signingError: SigningError = {
          code: 'SIGNING_FAILED',
          message: `Failed to sign ${transactionType} transaction`,
          details: err,
        };
        setError(signingError);
        throw signingError;
      } finally {
        setIsSigning(false);
      }
    },
    [getSeed, getChainId, user]
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
      return signTransaction(transfer, params as any, 'Transfer');
    },
    [signTransaction]
  );

  // Issue Transaction
  const signIssue = useCallback(
    async (params: Omit<IIssueParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(issue, params as any, 'Issue');
    },
    [signTransaction]
  );

  // Reissue Transaction
  const signReissue = useCallback(
    async (params: Omit<IReissueParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(reissue, params as any, 'Reissue');
    },
    [signTransaction]
  );

  // Burn Transaction
  const signBurn = useCallback(
    async (params: Omit<IBurnParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(burn, params as any, 'Burn');
    },
    [signTransaction]
  );

  // Lease Transaction
  const signLease = useCallback(
    async (params: Omit<ILeaseParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(lease, params as any, 'Lease');
    },
    [signTransaction]
  );

  // Cancel Lease Transaction
  const signCancelLease = useCallback(
    async (params: Omit<ICancelLeaseParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(cancelLease, params as any, 'CancelLease');
    },
    [signTransaction]
  );

  // Alias Transaction
  const signAlias = useCallback(
    async (params: Omit<IAliasParams, 'chainId' | 'senderPublicKey'>) => {
      setIsSigning(true);
      setError(null);

      try {
        // createAliasTransaction uses data-service signature API directly
        // It doesn't need a seed parameter
        const signedTx = await createAliasTransaction(params as any, '');
        return signedTx;
      } catch (err) {
        const signingError: SigningError = {
          code: 'SIGNING_FAILED',
          message: 'Failed to sign Alias transaction',
          details: err,
        };
        setError(signingError);
        throw signingError;
      } finally {
        setIsSigning(false);
      }
    },
    [setIsSigning, setError]
  );

  // Mass Transfer Transaction
  const signMassTransfer = useCallback(
    async (params: Omit<IMassTransferParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(massTransfer, params as any, 'MassTransfer');
    },
    [signTransaction]
  );

  // Data Transaction
  const signData = useCallback(
    async (params: Omit<IDataParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(data, params as any, 'Data');
    },
    [signTransaction]
  );

  // Set Script Transaction
  const signSetScript = useCallback(
    async (params: Omit<ISetScriptParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(setScript, params as any, 'SetScript');
    },
    [signTransaction]
  );

  // Sponsorship Transaction
  const signSponsorship = useCallback(
    async (params: Omit<ISponsorshipParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(sponsorship, params as any, 'Sponsorship');
    },
    [signTransaction]
  );

  // Set Asset Script Transaction
  const signSetAssetScript = useCallback(
    async (params: Omit<ISetAssetScriptParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(setAssetScript, params as any, 'SetAssetScript');
    },
    [signTransaction]
  );

  // Invoke Script Transaction
  const signInvokeScript = useCallback(
    async (params: Omit<IInvokeScriptParams, 'chainId' | 'senderPublicKey'>) => {
      return signTransaction(invokeScript, params as any, 'InvokeScript');
    },
    [signTransaction]
  );

  return {
    // Transfer
    signTransfer,

    // Asset Management
    signIssue,
    signReissue,
    signBurn,

    // Leasing
    signLease,
    signCancelLease,

    // Address & Data
    signAlias,
    signMassTransfer,
    signData,

    // Smart Contracts
    signSetScript,
    signSponsorship,
    signSetAssetScript,
    signInvokeScript,

    // State
    isSigning,
    error,
    clearError,
  };
};
