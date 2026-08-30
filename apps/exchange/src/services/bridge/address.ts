/**
 * DecentralChain address → the contract's 32-byte recipient field.
 *
 * This is the single most expensive function in the integration to get wrong,
 * and getting it wrong produces no error anywhere near the mistake.
 *
 * A DecentralChain address is exactly 26 bytes:
 *
 *     version(1) · chainId(1) · hash(20) · checksum(4)
 *
 * The contract's `recipient_dcc` field is `[u8; 32]`, so those 26 bytes are
 * right-padded with six zeros. The obvious way to recover the address on the
 * other side is to trim trailing zeros — and that is the bug. Roughly one
 * address in 256 ends in a checksum byte that is legitimately `0x00`, and
 * trimming eats it.
 *
 * What follows is silent: the trimmed value is a different, invalid address.
 * Signature verification still passes, because the signature covers the field
 * as sent. The failure surfaces later, inside the contract, where the mint
 * reverts — and the deposit is locked with no automatic recovery. The user
 * sees a deposit that confirmed on Solana and never arrived.
 *
 * The fix is to never infer the length: copy a fixed 26 bytes, always.
 */
import { base58Decode } from '@decentralchain/ts-lib-crypto';
import { DCC_ADDRESS_BYTES, RECIPIENT_FIELD_BYTES } from '@/config/bridge';

/**
 * Packs a base58 DecentralChain address into the contract's 32-byte field.
 *
 * @throws when the address does not decode to exactly 26 bytes — better to
 *   refuse than to send a field the contract will reject after the funds move
 */
export const dccAddressToBytes32 = (dccAddress: string): Uint8Array => {
  let decoded: Uint8Array;

  try {
    decoded = base58Decode(dccAddress);
  } catch {
    throw new Error(`Not a valid base58 DecentralChain address: "${dccAddress}"`);
  }

  if (decoded.length !== DCC_ADDRESS_BYTES) {
    throw new Error(
      `A DecentralChain address is ${DCC_ADDRESS_BYTES} bytes; "${dccAddress}" decoded to ` +
        `${decoded.length}. Refusing to build a recipient field from it.`,
    );
  }

  // Fixed-width copy into a zero-filled field. Never derive the length from
  // the content — a trailing 0x00 is data, not padding.
  const field = new Uint8Array(RECIPIENT_FIELD_BYTES);
  field.set(decoded, 0);

  return field;
};

/**
 * Recovers the address bytes from a 32-byte recipient field.
 *
 * Takes a fixed 26-byte slice. It does not look at the values, because the
 * only way to distinguish a checksum byte of `0x00` from padding is to not
 * ask the question.
 */
export const bytes32ToDccAddressBytes = (field: Uint8Array): Uint8Array => {
  if (field.length !== RECIPIENT_FIELD_BYTES) {
    throw new Error(`Recipient field must be ${RECIPIENT_FIELD_BYTES} bytes, got ${field.length}`);
  }

  return field.slice(0, DCC_ADDRESS_BYTES);
};
