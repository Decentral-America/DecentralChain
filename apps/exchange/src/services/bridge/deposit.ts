/**
 * Deposit instructions: Solana → DecentralChain.
 *
 * Instruction data is encoded by Anchor from the program's own IDL rather than
 * by hand. Hand-rolled discriminators and hand-packed Borsh are how the
 * account-ordering class of bug happens, and the program reports those as
 * ownership errors that name the wrong cause.
 *
 * The account lists below are written out explicitly because that is what a
 * reader needs to check against the program. `__tests__/deposit.test.ts`
 * asserts each one against the IDL, so an IDL update that reorders or inserts
 * an account fails the suite rather than the mint.
 */
import { BN, BorshInstructionCoder, type Idl } from '@coral-xyz/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { SOLANA_PROGRAM_ID } from '@/config/bridge';
import {
  bridgeConfigPda,
  depositRecordPda,
  mintLimitsPda,
  senderTokenAccount,
  userStatePda,
  vaultPda,
  vaultTokenAccount,
} from './pda';
import idlJson from './sol_bridge_lock.json';

const idl = idlJson as Idl;
const coder = new BorshInstructionCoder(idl);

export interface DepositArgs {
  /** Raw base units to lock. */
  amount: bigint;
  /** The recipient's 32-byte DecentralChain field — see `address.ts`. */
  recipientDcc: Uint8Array;
  sender: PublicKey;
  /** 32 bytes, from `deriveTransferId`. */
  transferId: Uint8Array;
}

const assertParams = ({ amount, recipientDcc, transferId }: DepositArgs): void => {
  if (recipientDcc.length !== 32) {
    throw new Error(`recipient_dcc must be 32 bytes, got ${recipientDcc.length}`);
  }
  if (transferId.length !== 32) {
    throw new Error(`transfer_id must be 32 bytes, got ${transferId.length}`);
  }
  if (amount <= 0n) {
    throw new Error('Deposit amount must be greater than zero');
  }
};

/**
 * Anchor's coder takes the IDL's own field names. This IDL is spec 0.1.0, so
 * the fields are snake_case exactly as the program declares them.
 *
 * `amount` crosses as a BN: Anchor's u64 layout calls `toArrayLike` on the
 * value, which a native bigint does not implement. The bigint is the right
 * type everywhere else in this codebase — exact integer arithmetic on raw
 * units — so the conversion happens here, at the boundary, rather than
 * spreading BN through the amount helpers.
 */
const encode = (instruction: string, args: DepositArgs): Buffer =>
  coder.encode(instruction, {
    params: {
      amount: new BN(args.amount.toString()),
      recipient_dcc: Array.from(args.recipientDcc),
      transfer_id: Array.from(args.transferId),
    },
  });

const programId = new PublicKey(SOLANA_PROGRAM_ID);

/**
 * Native SOL deposit. Six accounts, no token program.
 */
export const buildDepositInstruction = (args: DepositArgs): TransactionInstruction => {
  assertParams(args);

  return new TransactionInstruction({
    data: encode('deposit', args),
    keys: [
      { isSigner: false, isWritable: true, pubkey: bridgeConfigPda() },
      { isSigner: false, isWritable: true, pubkey: userStatePda(args.sender) },
      { isSigner: false, isWritable: true, pubkey: depositRecordPda(args.transferId) },
      { isSigner: false, isWritable: true, pubkey: vaultPda() },
      { isSigner: true, isWritable: true, pubkey: args.sender },
      { isSigner: false, isWritable: false, pubkey: SystemProgram.programId },
    ],
    programId,
  });
};

/**
 * SPL deposit. Eleven accounts.
 *
 * `mint_limits` is at index 5 — inserted between `spl_mint` and
 * `sender_token_account`, not appended. Omitting it shifts every later account
 * by one and the program answers `AccountOwnedByWrongProgram (3007)`, which
 * reads like a wrong address rather than a missing account.
 */
export const buildDepositSplInstruction = (
  args: DepositArgs & { splMint: PublicKey },
): TransactionInstruction => {
  assertParams(args);

  return new TransactionInstruction({
    data: encode('deposit_spl', args),
    keys: [
      { isSigner: false, isWritable: true, pubkey: bridgeConfigPda() },
      { isSigner: false, isWritable: true, pubkey: userStatePda(args.sender) },
      { isSigner: false, isWritable: true, pubkey: depositRecordPda(args.transferId) },
      { isSigner: false, isWritable: false, pubkey: args.splMint },
      { isSigner: false, isWritable: false, pubkey: mintLimitsPda(args.splMint) },
      { isSigner: false, isWritable: true, pubkey: senderTokenAccount(args.splMint, args.sender) },
      { isSigner: false, isWritable: true, pubkey: vaultTokenAccount(args.splMint) },
      { isSigner: true, isWritable: true, pubkey: args.sender },
      { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
      { isSigner: false, isWritable: false, pubkey: ASSOCIATED_TOKEN_PROGRAM_ID },
      { isSigner: false, isWritable: false, pubkey: SystemProgram.programId },
    ],
    programId,
  });
};
