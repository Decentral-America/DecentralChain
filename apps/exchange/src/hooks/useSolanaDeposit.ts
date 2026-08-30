/**
 * useSolanaDeposit Hook
 * Locks an asset on Solana so the bridge mints its wrapped form on DecentralChain.
 *
 * The transfer id is derived here, before submission, from the sender's
 * on-chain nonce. That ordering is why `GET /transfer/:id` legitimately
 * answers with its unknown-placeholder for a while after a deposit — the id
 * exists client-side before the bridge has ever seen it.
 */
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useCallback, useState } from 'react';
import { dccAddressToBytes32 } from '@/services/bridge/address';
import { buildDepositInstruction, buildDepositSplInstruction } from '@/services/bridge/deposit';
import { userStatePda } from '@/services/bridge/pda';
import {
  deriveTransferId,
  readUserStateNonce,
  transferIdToHex,
} from '@/services/bridge/transferId';
import { type BridgeToken } from '@/services/bridge/types';

/** The wrapped native SOL mint — the only asset that takes the non-SPL path. */
const NATIVE_MINT = 'So11111111111111111111111111111111111111112';

export interface DepositRequest {
  /** Raw Solana base units to lock. */
  amountRaw: bigint;
  /** The user's DecentralChain address, where the wrapped asset is minted. */
  dccRecipient: string;
  token: BridgeToken;
}

export interface DepositResult {
  signature: string;
  /** Hex id to poll `GET /transfer/:transferId` with. Keep it. */
  transferId: string;
}

export interface UseSolanaDepositReturn {
  deposit: (request: DepositRequest) => Promise<DepositResult>;
  error: string | null;
  isSubmitting: boolean;
}

export const useSolanaDeposit = (): UseSolanaDepositReturn => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const deposit = useCallback(
    async ({ amountRaw, dccRecipient, token }: DepositRequest): Promise<DepositResult> => {
      setError(null);
      setIsSubmitting(true);

      try {
        if (!publicKey) {
          throw new Error('Connect a Solana wallet first');
        }

        // Throws rather than truncating if the address is malformed. A wrong
        // recipient field mints to an address nobody controls, and the failure
        // lands inside the contract with no automatic recovery.
        const recipientDcc = dccAddressToBytes32(dccRecipient);

        // The account does not exist before the first deposit; that is nonce 0,
        // not an error.
        const userState = await connection.getAccountInfo(userStatePda(publicKey));
        const nonce = readUserStateNonce(userState ? new Uint8Array(userState.data) : null);

        const transferId = deriveTransferId(publicKey.toBytes(), nonce);

        const instruction =
          token.splMint === NATIVE_MINT
            ? buildDepositInstruction({
                amount: amountRaw,
                recipientDcc,
                sender: publicKey,
                transferId,
              })
            : buildDepositSplInstruction({
                amount: amountRaw,
                recipientDcc,
                sender: publicKey,
                splMint: new PublicKey(token.splMint),
                transferId,
              });

        const signature = await sendTransaction(new Transaction().add(instruction), connection);

        return { signature, transferId: transferIdToHex(transferId) };
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Deposit failed';
        setError(message);
        throw caught;
      } finally {
        setIsSubmitting(false);
      }
    },
    [connection, publicKey, sendTransaction],
  );

  return { deposit, error, isSubmitting };
};
