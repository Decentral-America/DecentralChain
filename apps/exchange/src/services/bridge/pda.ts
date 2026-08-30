/**
 * Program-derived addresses for the bridge program.
 *
 * Every seed here is load-bearing: a wrong one produces a valid-looking
 * address that the program does not recognise, and the instruction fails with
 * an ownership error rather than anything that names the real cause.
 *
 * `bridgeConfigPda` and `vaultPda` are derived rather than read from the
 * constants file, and a test asserts the derivation reproduces the published
 * addresses. That way the seeds are checked against the live program instead
 * of being trusted.
 */
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { SOLANA_PROGRAM_ID } from '@/config/bridge';

const programId = new PublicKey(SOLANA_PROGRAM_ID);

const seed = (text: string): Uint8Array => new TextEncoder().encode(text);

const derive = (seeds: Uint8Array[]): PublicKey =>
  PublicKey.findProgramAddressSync(seeds, programId)[0];

/** `['bridge_config']` */
export const bridgeConfigPda = (): PublicKey => derive([seed('bridge_config')]);

/** `['vault']` — holds locked native SOL. */
export const vaultPda = (): PublicKey => derive([seed('vault')]);

/** `['user_state', sender]` — carries the deposit nonce. May not exist yet. */
export const userStatePda = (sender: PublicKey): PublicKey =>
  derive([seed('user_state'), sender.toBytes()]);

/** `['deposit', transfer_id]` — one record per deposit, created by the instruction. */
export const depositRecordPda = (transferId: Uint8Array): PublicKey =>
  derive([seed('deposit'), transferId]);

/**
 * `['mint_limits', spl_mint]` — SPL deposits only.
 *
 * This account sits at index 5 of `deposit_spl`, between `spl_mint` and
 * `sender_token_account`. It is inserted, not appended: omit it and every
 * later account shifts by one, and the program reports
 * `AccountOwnedByWrongProgram (3007)` — which reads like a wrong address
 * rather than a missing account.
 */
export const mintLimitsPda = (splMint: PublicKey): PublicKey =>
  derive([seed('mint_limits'), splMint.toBytes()]);

/**
 * The bridge's token account for an SPL asset.
 *
 * Owned by `bridge_config`, which is itself a PDA and therefore off the
 * ed25519 curve — hence `allowOwnerOffCurve`. Without it this throws rather
 * than returning the address the program expects.
 */
export const vaultTokenAccount = (splMint: PublicKey): PublicKey =>
  getAssociatedTokenAddressSync(splMint, bridgeConfigPda(), true);

/** The depositor's own token account. An ordinary wallet-owned ATA. */
export const senderTokenAccount = (splMint: PublicKey, sender: PublicKey): PublicKey =>
  getAssociatedTokenAddressSync(splMint, sender, false);
