/**
 * Transaction Signing Hook
 * Provides methods to sign various transaction types using @decentralchain/transactions
 */

import {
  alias,
  burn,
  cancelLease,
  data,
  type IAliasParams,
  type IBurnParams,
  type ICancelLeaseParams,
  type IDataParams,
  type IInvokeScriptParams,
  type IIssueParams,
  type ILeaseParams,
  type IMassTransferParams,
  type IReissueParams,
  type ISetAssetScriptParams,
  type ISetScriptParams,
  type ISponsorshipParams,
  type ITransferParams,
  invokeScript,
  issue,
  lease,
  massTransfer,
  reissue,
  setAssetScript,
  setScript,
  sponsorship,
  transfer,
} from '@decentralchain/transactions';
import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConfig } from '@/contexts/ConfigContext';
import { multiAccount } from '@/services/multiAccount';

const MULTI_ACCOUNT_USERS_KEY = 'multiAccountUsers';

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
   * Get the decrypted seed from in-memory multiAccount state.
   * multiAccount.toList() returns in-memory decrypted data — no re-decryption needed.
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

    const storedUsers = JSON.parse(localStorage.getItem(MULTI_ACCOUNT_USERS_KEY) ?? '{}') as Record<
      string,
      Record<string, unknown>
    >;

    const entry = multiAccount.toList(storedUsers).find((u) => u.publicKey === user.publicKey);

    if (!entry?.seed) {
      throw new Error('Seed not available — please re-authenticate');
    }

    return entry.seed;
  }, [user]);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Error-handling wrapper. Calls fn() directly (no type params) so each
   * builder is invoked at its own call-site, letting TypeScript pick the
   * correct first overload rather than the wider last-overload fallback.
   */
  const withSigning = useCallback(
    async (fn: () => unknown, transactionType: string): Promise<unknown> => {
      setIsSigning(true);
      setError(null);
      try {
        return fn();
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
    [],
  );

  const signTransfer = useCallback(
    (params: Omit<ITransferParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => transfer({ ...params, chainId: networkByte } as ITransferParams, getSeed()),
        'Transfer',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signIssue = useCallback(
    (params: Omit<IIssueParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => issue({ ...params, chainId: networkByte } as IIssueParams, getSeed()),
        'Issue',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signReissue = useCallback(
    (params: Omit<IReissueParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => reissue({ ...params, chainId: networkByte } as IReissueParams, getSeed()),
        'Reissue',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signBurn = useCallback(
    (params: Omit<IBurnParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => burn({ ...params, chainId: networkByte } as IBurnParams, getSeed()),
        'Burn',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signLease = useCallback(
    (params: Omit<ILeaseParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => lease({ ...params, chainId: networkByte } as ILeaseParams, getSeed()),
        'Lease',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signCancelLease = useCallback(
    (params: Omit<ICancelLeaseParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => cancelLease({ ...params, chainId: networkByte } as ICancelLeaseParams, getSeed()),
        'CancelLease',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signAlias = useCallback(
    (params: Omit<IAliasParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => alias({ ...params, chainId: networkByte } as IAliasParams, getSeed()),
        'Alias',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signMassTransfer = useCallback(
    (params: Omit<IMassTransferParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => massTransfer({ ...params, chainId: networkByte } as IMassTransferParams, getSeed()),
        'MassTransfer',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signData = useCallback(
    (params: Omit<IDataParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => data({ ...params, chainId: networkByte } as IDataParams, getSeed()),
        'Data',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signSetScript = useCallback(
    (params: Omit<ISetScriptParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => setScript({ ...params, chainId: networkByte } as ISetScriptParams, getSeed()),
        'SetScript',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signSponsorship = useCallback(
    (params: Omit<ISponsorshipParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => sponsorship({ ...params, chainId: networkByte } as ISponsorshipParams, getSeed()),
        'Sponsorship',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signSetAssetScript = useCallback(
    (params: Omit<ISetAssetScriptParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () =>
          setAssetScript({ ...params, chainId: networkByte } as ISetAssetScriptParams, getSeed()),
        'SetAssetScript',
      ),
    [withSigning, getSeed, networkByte],
  );

  const signInvokeScript = useCallback(
    (params: Omit<IInvokeScriptParams, 'chainId' | 'senderPublicKey'>) =>
      withSigning(
        () => invokeScript({ ...params, chainId: networkByte } as IInvokeScriptParams, getSeed()),
        'InvokeScript',
      ),
    [withSigning, getSeed, networkByte],
  );

  return {
    clearError,
    error,
    isSigning,
    signAlias,
    signBurn,
    signCancelLease,
    signData,
    signInvokeScript,
    signIssue,
    signLease,
    signMassTransfer,
    signReissue,
    signSetAssetScript,
    signSetScript,
    signSponsorship,
    signTransfer,
  };
};
