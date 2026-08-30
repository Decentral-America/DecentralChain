/**
 * useBridgeWithdraw Hook
 * Burns a wrapped asset on DecentralChain to release the original on Solana.
 *
 * Thin by design: signing, confirmation UI and broadcast already exist in this
 * app. The bridge-specific parts are the invocation shape, the pre-flight fee
 * check and the address validation, and those live in `services/bridge`.
 */
import { useCallback, useState } from 'react';
import { useBroadcast } from '@/hooks/useBroadcast';
import { useTransactionSigning } from '@/hooks/useTransactionSigning';
import { type BridgeToken } from '@/services/bridge/types';
import { buildBurnToken, canPayTxFee, withdrawBreakdown } from '@/services/bridge/withdraw';

export interface WithdrawRequest {
  amountRaw: bigint;
  /** The account's DCC balance in wavelets, for the fee pre-flight. */
  dccBalanceRaw: bigint;
  solanaRecipient: string;
  token: BridgeToken;
}

export interface UseBridgeWithdrawReturn {
  error: string | null;
  isSubmitting: boolean;
  reset: () => void;
  /** Resolves to the burn transaction id. */
  withdraw: (request: WithdrawRequest) => Promise<string>;
}

export const useBridgeWithdraw = (): UseBridgeWithdrawReturn => {
  const { signInvokeScript } = useTransactionSigning();
  const { broadcastAsync } = useBroadcast();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const withdraw = useCallback(
    async ({ amountRaw, dccBalanceRaw, solanaRecipient, token }: WithdrawRequest) => {
      setError(null);
      setIsSubmitting(true);

      try {
        // Checked before the wallet prompt: without the fee the node refuses
        // the broadcast, and that surfaces as a generic failure that says
        // nothing about DCC balance.
        if (!canPayTxFee(dccBalanceRaw)) {
          const { txFee } = withdrawBreakdown(amountRaw);
          throw new Error(
            `This burn needs ${txFee / 1e8} DCC for the transaction fee, and the account does ` +
              'not hold it. Wrapped assets cannot pay their own withdrawal fee.',
          );
        }

        const invocation = buildBurnToken({ amountRaw, solanaRecipient, token });
        const signed = await signInvokeScript(invocation);
        const result = await broadcastAsync(signed as Parameters<typeof broadcastAsync>[0]);

        return result.id;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Withdrawal failed';
        setError(message);
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [broadcastAsync, signInvokeScript],
  );

  return {
    error,
    isSubmitting,
    reset: useCallback(() => setError(null), []),
    withdraw,
  };
};
