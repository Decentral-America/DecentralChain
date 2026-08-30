/**
 * Withdrawal: DecentralChain → Solana.
 *
 * The user calls `burnToken` on the bridge contract with the wrapped asset
 * attached as payment. The validators observe the burn, gather attestations
 * across several Solana transactions, and release the locked funds — which is
 * why this settles in minutes rather than the ~75 seconds a deposit takes.
 *
 * Two costs, and the user should see both before they commit:
 *   - a DecentralChain transaction fee of 0.009 DCC, paid in DCC
 *   - a 0.25% bridge fee, deducted from the amount withdrawn
 *
 * The transaction fee is the one that bites: a user holding plenty of wrapped
 * USDC but no DCC cannot broadcast at all, and the failure looks like a
 * rejected signature rather than an empty fee balance.
 */
import { PublicKey } from '@solana/web3.js';
import { DCC_BRIDGE_CONTRACT, WITHDRAW_FEE_RATE, WITHDRAW_TX_FEE } from '@/config/bridge';
import { type BridgeToken } from './types';

export interface WithdrawParams {
  /** Raw units of the wrapped asset to burn. */
  amountRaw: bigint;
  /** Base58 Solana address that receives the released funds. */
  solanaRecipient: string;
  token: BridgeToken;
}

/** Shape accepted by `useTransactionSigning().signInvokeScript`. */
export interface BurnTokenInvocation {
  call: {
    args: { type: 'string'; value: string }[];
    function: 'burnToken';
  };
  dApp: string;
  fee: number;
  payment: { amount: number; assetId: string }[];
}

/**
 * Largest amount that survives the trip through JSON as an exact integer.
 *
 * The node requires `payment[].amount` to be a JSON *number* — it rejects a
 * string with `error.expected.jsnumber`, even though the SDK types the field
 * as `LONG = string | number` and therefore compiles either. Amounts are held
 * as bigint everywhere else in this codebase precisely because raw units must
 * stay exact, so the conversion happens here, at the boundary, and refuses
 * rather than silently rounding.
 *
 * At 8 decimals the ceiling is ~90 million DCC — far above any real
 * withdrawal, but a wrong answer here would be a wrong amount of money.
 */
const MAX_EXACT_JSON_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);

/** True for a well-formed base58 ed25519 public key. */
export const isValidSolanaAddress = (value: string): boolean => {
  try {
    // Decodes and range-checks; a 32-byte base58 string that is not a valid
    // point still constructs, so length is the meaningful assertion.
    return new PublicKey(value).toBytes().length === 32;
  } catch {
    return false;
  }
};

/**
 * Builds the `burnToken` invocation.
 *
 * @throws when the recipient is not a Solana address — sending the burn to a
 *   malformed recipient destroys the wrapped asset with nothing released on
 *   the other side
 */
export const buildBurnToken = ({
  amountRaw,
  solanaRecipient,
  token,
}: WithdrawParams): BurnTokenInvocation => {
  if (!isValidSolanaAddress(solanaRecipient)) {
    throw new Error(
      `"${solanaRecipient}" is not a valid Solana address. The burn would succeed and the ` +
        'release would have nowhere to go.',
    );
  }

  if (amountRaw <= 0n) {
    throw new Error('Withdrawal amount must be greater than zero');
  }

  if (amountRaw > MAX_EXACT_JSON_INTEGER) {
    throw new Error(
      `${amountRaw} exceeds the largest integer JSON can carry exactly. ` +
        'Refusing to send an amount that would be rounded in transit.',
    );
  }

  return {
    call: {
      args: [
        { type: 'string', value: solanaRecipient },
        { type: 'string', value: token.splMint },
      ],
      function: 'burnToken',
    },
    dApp: DCC_BRIDGE_CONTRACT,
    fee: WITHDRAW_TX_FEE,
    payment: [{ amount: Number(amountRaw), assetId: token.assetId }],
  };
};

export interface WithdrawBreakdown {
  /** Raw units burned — the full amount the user submits. */
  burnedRaw: bigint;
  /** Raw units the bridge keeps as its 0.25% fee. */
  bridgeFeeRaw: bigint;
  /** Raw units that actually arrive on Solana, after the bridge fee. */
  receivedRaw: bigint;
  /** DCC wavelets needed to broadcast, independent of the amount. */
  txFee: number;
}

/**
 * What the user burns, what the bridge keeps, what arrives.
 *
 * Integer arithmetic throughout: the fee is basis points on a raw amount, and
 * doing it in floating point introduces error at exactly the magnitudes where
 * it is least forgivable.
 */
export const withdrawBreakdown = (amountRaw: bigint): WithdrawBreakdown => {
  const feeBasisPoints = BigInt(Math.round(WITHDRAW_FEE_RATE * 10_000));
  const bridgeFeeRaw = (amountRaw * feeBasisPoints) / 10_000n;

  return {
    bridgeFeeRaw,
    burnedRaw: amountRaw,
    receivedRaw: amountRaw - bridgeFeeRaw,
    txFee: WITHDRAW_TX_FEE,
  };
};

/**
 * True when the account holds enough DCC to broadcast.
 *
 * Checked before the wallet prompt because the alternative is a signature the
 * node refuses, which surfaces as a generic broadcast failure with no mention
 * of the fee.
 */
export const canPayTxFee = (dccBalanceRaw: bigint): boolean =>
  dccBalanceRaw >= BigInt(WITHDRAW_TX_FEE);
