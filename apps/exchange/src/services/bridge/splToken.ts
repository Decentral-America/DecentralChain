/**
 * The two SPL Token program ids and the associated-token-account derivation.
 *
 * This is all the bridge needs from `@solana/spl-token`, and it is carried
 * here instead of depending on that package: spl-token pulls in
 * `@solana/buffer-layout-utils` -> `bigint-buffer`, which has an unpatched
 * buffer-overflow advisory (GHSA-3gc7-fjrx-p6mg, no fixed release exists).
 *
 * The derivation mirrors spl-token's `getAssociatedTokenAddressSync`
 * (src/state/mint.ts) exactly: seeds `[owner, tokenProgram, mint]` under the
 * Associated Token program, rejecting an off-curve owner unless explicitly
 * allowed. Tests pin it to addresses spl-token itself produced.
 */
import { PublicKey } from '@solana/web3.js';

/** SPL Token program. */
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

/** Associated Token Account program. */
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

/** Thrown for an off-curve (PDA) owner when `allowOwnerOffCurve` is false. */
export class TokenOwnerOffCurveError extends Error {
  override name = 'TokenOwnerOffCurveError';
}

export function getAssociatedTokenAddressSync(
  mint: PublicKey,
  owner: PublicKey,
  allowOwnerOffCurve = false,
): PublicKey {
  if (!allowOwnerOffCurve && !PublicKey.isOnCurve(owner.toBytes())) {
    throw new TokenOwnerOffCurveError();
  }
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBytes(), TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return address;
}
