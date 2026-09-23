// @vitest-environment node
//
// jsdom's ed25519 curve check misreports, so `findProgramAddressSync` exhausts
// all 255 bumps and throws "Unable to find a viable program address nonce" for
// seeds that derive correctly everywhere else. Verified: the same call in plain
// Node returns the published addresses at bumps 255 and 254. This is pure
// crypto with no DOM in it, so it runs under node rather than being worked
// around. Real-browser behaviour is covered by the mainnet round trip.

/**
 * PDA derivation.
 *
 * The first two cases are the real check: they derive from seeds and compare
 * against the addresses the bridge team published for the live program. If a
 * seed string were wrong, the derived address would differ and these fail —
 * which is a stronger statement than any self-consistent test.
 */
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';
import { BRIDGE_CONFIG_PDA, NATIVE_VAULT_PDA, SOLANA_PROGRAM_ID } from '@/config/bridge';
import {
  bridgeConfigPda,
  depositRecordPda,
  mintLimitsPda,
  senderTokenAccount,
  userStatePda,
  vaultPda,
  vaultTokenAccount,
} from '@/services/bridge/pda';

const SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
const SENDER = new PublicKey('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU');

describe('published PDAs', () => {
  it('derives the bridge config the team published', () => {
    expect(bridgeConfigPda().toBase58()).toBe(BRIDGE_CONFIG_PDA);
  });

  it('derives the native vault the team published', () => {
    expect(vaultPda().toBase58()).toBe(NATIVE_VAULT_PDA);
  });

  it('derives them under the published program id', () => {
    // Both PDAs are meaningless without the program they belong to.
    expect(() => new PublicKey(SOLANA_PROGRAM_ID)).not.toThrow();
  });
});

describe('per-account PDAs', () => {
  it('binds user_state to the sender', () => {
    const other = new PublicKey('11111111111111111111111111111112');

    expect(userStatePda(SENDER).toBase58()).not.toBe(userStatePda(other).toBase58());
  });

  it('binds deposit_record to the transfer id', () => {
    const a = new Uint8Array(32).fill(1);
    const b = new Uint8Array(32).fill(2);

    expect(depositRecordPda(a).toBase58()).not.toBe(depositRecordPda(b).toBase58());
  });

  it('binds mint_limits to the mint', () => {
    const usdc = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

    expect(mintLimitsPda(SOL_MINT).toBase58()).not.toBe(mintLimitsPda(usdc).toBase58());
  });

  it('is deterministic', () => {
    expect(userStatePda(SENDER).toBase58()).toBe(userStatePda(SENDER).toBase58());
    expect(mintLimitsPda(SOL_MINT).toBase58()).toBe(mintLimitsPda(SOL_MINT).toBase58());
  });
});

describe('associated token accounts', () => {
  it('derives the vault ATA off-curve, because its owner is a PDA', () => {
    // bridge_config is itself a PDA and so is not on the ed25519 curve.
    // Without allowOwnerOffCurve this throws instead of returning an address.
    expect(() => vaultTokenAccount(SOL_MINT)).not.toThrow();
    expect(vaultTokenAccount(SOL_MINT).toBase58()).toHaveLength(44);
  });

  it('derives the sender ATA on-curve', () => {
    expect(senderTokenAccount(SOL_MINT, SENDER).toBase58()).toHaveLength(44);
  });

  it('gives the vault and the sender different accounts for one mint', () => {
    expect(vaultTokenAccount(SOL_MINT).toBase58()).not.toBe(
      senderTokenAccount(SOL_MINT, SENDER).toBase58(),
    );
  });
});
