/**
 * Deposit transfer id.
 *
 *     transfer_id = sha256( senderPubkey ++ u64LE(nonce) )
 *
 * The nonce lives in the sender's `UserState` account at byte offset 40, as a
 * little-endian u64. That account does not exist until the sender's first
 * deposit, and its absence means nonce 0 — not an error.
 *
 * The id is derived before the transaction is submitted, which is why
 * `GET /transfer/:id` legitimately returns its "unknown" placeholder for a
 * while after a deposit. See `useTransferStatus`.
 */
import { sha256 } from '@decentralchain/ts-lib-crypto';
import { USER_STATE_NONCE_OFFSET } from '@/config/bridge';

const NONCE_BYTES = 8;

/** Little-endian u64, the encoding the program uses. */
export const u64ToLeBytes = (value: bigint): Uint8Array => {
  if (value < 0n || value > 0xffff_ffff_ffff_ffffn) {
    throw new Error(`Nonce out of u64 range: ${value}`);
  }

  const bytes = new Uint8Array(NONCE_BYTES);
  let remaining = value;

  for (let i = 0; i < NONCE_BYTES; i++) {
    bytes[i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }

  return bytes;
};

/**
 * Reads the nonce out of a raw `UserState` account.
 *
 * @param accountData raw account bytes, or null when the account does not
 *   exist yet — the sender's first deposit, which is nonce 0
 */
export const readUserStateNonce = (accountData: Uint8Array | null): bigint => {
  if (accountData === null) {
    return 0n;
  }

  const end = USER_STATE_NONCE_OFFSET + NONCE_BYTES;

  if (accountData.length < end) {
    throw new Error(
      `UserState is ${accountData.length} bytes; the nonce needs ${end}. ` +
        'Refusing to guess — a wrong nonce derives a transfer id the bridge will never settle.',
    );
  }

  let value = 0n;
  for (let i = NONCE_BYTES - 1; i >= 0; i--) {
    value = (value << 8n) | BigInt(accountData[USER_STATE_NONCE_OFFSET + i] as number);
  }

  return value;
};

/**
 * @param senderPubkey the sender's 32-byte Solana public key
 *   (`publicKey.toBytes()`)
 */
export const deriveTransferId = (senderPubkey: Uint8Array, nonce: bigint): Uint8Array => {
  if (senderPubkey.length !== 32) {
    throw new Error(`A Solana public key is 32 bytes, got ${senderPubkey.length}`);
  }

  const input = new Uint8Array(32 + NONCE_BYTES);
  input.set(senderPubkey, 0);
  input.set(u64ToLeBytes(nonce), 32);

  return sha256(input);
};

/** Hex, the form `GET /transfer/:transferId` expects. */
export const transferIdToHex = (transferId: Uint8Array): string =>
  Array.from(transferId, (byte) => byte.toString(16).padStart(2, '0')).join('');
