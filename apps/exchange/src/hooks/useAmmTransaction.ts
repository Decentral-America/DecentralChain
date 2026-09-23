/**
 * AMM writes: swap, add liquidity, remove liquidity.
 *
 * The SDK builds an unsigned invocation; this app's own signer signs it and
 * its own broadcaster sends it. The reference AMM frontend asks the user to
 * paste a 15-word seed into a modal and holds it in React state for the
 * session — this app already stores an encrypted seed behind an unlock, so
 * that model is deliberately not copied here.
 */
import { useCallback, useState } from 'react';
import { AMM_DEFAULT_FEE_BPS, AMM_DEFAULT_SLIPPAGE_BPS } from '@/config/amm';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { confirmApplied, getAmmSdk } from '@/services/amm/client';

/** The unsigned shape the SDK returns. */
interface UnsignedInvoke {
  call: { args: unknown[]; function: string };
  dApp: string;
  fee: number;
  payment: { amount: number; assetId: string | null }[];
}

export interface AmmTxResult {
  /** True only when the script itself succeeded, not merely when it was mined. */
  applied: boolean;
  applicationStatus: string | null;
  txId: string;
}

export interface UseAmmTransactionReturn {
  createPool: (args: { assetA: string; assetB: string; feeBps?: number }) => Promise<AmmTxResult>;
  addLiquidity: (args: {
    amountA: bigint;
    amountB: bigint;
    assetA: string;
    assetB: string;
    feeBps?: number;
  }) => Promise<AmmTxResult>;
  error: string | null;
  /** Set once broadcast, while the application status is still unknown. */
  isConfirming: boolean;
  isSubmitting: boolean;
  removeLiquidity: (args: {
    assetA: string;
    assetB: string;
    feeBps?: number;
    lpAmount: bigint;
  }) => Promise<AmmTxResult>;
  reset: () => void;
  swap: (args: {
    amountIn: bigint;
    assetIn: string;
    assetOut: string;
    feeBps?: number;
    slippageBps?: bigint;
  }) => Promise<AmmTxResult>;
}

export const useAmmTransaction = (): UseAmmTransactionReturn => {
  const { signInvokeScript } = useTransactionSigning();
  const { broadcastAsync } = useBroadcast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  /**
   * Sign, broadcast, then find out whether the call did anything.
   *
   * A mined transaction is not a successful one. A callable's `must(...)` can
   * fail during script execution: the transaction is mined and the fee is
   * charged, but state is unchanged and the only record is
   * `applicationStatus`. Reporting a swap as done on broadcast alone tells the
   * user their trade went through when it did not.
   */
  const submit = useCallback(
    async (tx: UnsignedInvoke): Promise<AmmTxResult> => {
      setError(null);
      setIsSubmitting(true);

      try {
        const signed = await signInvokeScript({
          call: tx.call as Parameters<typeof signInvokeScript>[0]['call'],
          dApp: tx.dApp,
          fee: tx.fee,
          payment: tx.payment,
        } as Parameters<typeof signInvokeScript>[0]);

        const broadcastResult = await broadcastAsync(
          signed as Parameters<typeof broadcastAsync>[0],
        );

        setIsSubmitting(false);
        setIsConfirming(true);

        const { applied, status } = await confirmApplied(broadcastResult.id);

        if (!applied) {
          setError(
            status
              ? `The transaction was mined but the contract rejected it (${status}). The fee was charged and nothing moved.`
              : 'The transaction was broadcast but its result could not be confirmed. Check the explorer before retrying.',
          );
        }

        return { applicationStatus: status, applied, txId: broadcastResult.id };
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Transaction failed';
        setError(message);
        throw caught;
      } finally {
        setIsSubmitting(false);
        setIsConfirming(false);
      }
    },
    [broadcastAsync, signInvokeScript],
  );

  const swap = useCallback(
    async ({
      amountIn,
      assetIn,
      assetOut,
      feeBps = AMM_DEFAULT_FEE_BPS,
      slippageBps = AMM_DEFAULT_SLIPPAGE_BPS,
    }: {
      amountIn: bigint;
      assetIn: string;
      assetOut: string;
      feeBps?: number;
      slippageBps?: bigint;
    }) => {
      const { tx } = await getAmmSdk().buildSwap(amountIn, assetIn, assetOut, feeBps, slippageBps);
      return submit(tx as unknown as UnsignedInvoke);
    },
    [submit],
  );

  /**
   * Create a pool for a pair at a fee tier.
   *
   * The pool is empty afterwards — creating and funding are two steps, and the
   * first deposit sets the initial price. The SDK derives the pool id from the
   * pair and tier, so the canonical ordering is never hand-built.
   */
  const createPool = useCallback(
    async ({
      assetA,
      assetB,
      feeBps = AMM_DEFAULT_FEE_BPS,
    }: {
      assetA: string;
      assetB: string;
      feeBps?: number;
    }) => {
      const { tx } = getAmmSdk().buildCreatePool(assetA, assetB, feeBps);
      return submit(tx as unknown as UnsignedInvoke);
    },
    [submit],
  );

  const addLiquidity = useCallback(
    async ({
      amountA,
      amountB,
      assetA,
      assetB,
      feeBps = AMM_DEFAULT_FEE_BPS,
    }: {
      amountA: bigint;
      amountB: bigint;
      assetA: string;
      assetB: string;
      feeBps?: number;
    }) => {
      const { tx } = await getAmmSdk().buildAddLiquidity(
        assetA,
        assetB,
        amountA,
        amountB,
        feeBps,
        AMM_DEFAULT_SLIPPAGE_BPS,
      );
      return submit(tx as unknown as UnsignedInvoke);
    },
    [submit],
  );

  const removeLiquidity = useCallback(
    async ({
      assetA,
      assetB,
      feeBps = AMM_DEFAULT_FEE_BPS,
      lpAmount,
    }: {
      assetA: string;
      assetB: string;
      feeBps?: number;
      lpAmount: bigint;
    }) => {
      // The pool is addressed by its pair and fee tier; the SDK derives the
      // pool id itself so the canonical ordering is never hand-built.
      const { tx } = await getAmmSdk().buildRemoveLiquidity(
        assetA,
        assetB,
        feeBps,
        lpAmount,
        AMM_DEFAULT_SLIPPAGE_BPS,
      );
      return submit(tx as unknown as UnsignedInvoke);
    },
    [submit],
  );

  return {
    addLiquidity,
    createPool,
    error,
    isConfirming,
    isSubmitting,
    removeLiquidity,
    reset: useCallback(() => setError(null), []),
    swap,
  };
};
