import { base16Encode, base58Decode } from '@decentralchain/ts-lib-crypto';

/** Convert a DCC asset ID to its Ethereum-compatible hex representation. */
export default function dccAsset2Eth(dccAsset: string): string {
  if (typeof dccAsset !== 'string' || dccAsset.length === 0) {
    throw new TypeError(
      `Invalid DCC asset ID: expected non-empty string, received ${typeof dccAsset === 'string' ? `"${dccAsset}"` : String(dccAsset)}`,
    );
  }

  const rawBytes = base58Decode(dccAsset);

  // A DCC asset ID is a 32-byte hash. Ensure we have enough bytes.
  if (rawBytes.byteLength < 20) {
    throw new TypeError(
      `Invalid DCC asset ID: decoded to ${String(rawBytes.byteLength)} bytes, need at least 20`,
    );
  }

  // Take the first 20 bytes for the Ethereum-compatible address
  const bytes = rawBytes.slice(0, 20);

  return `0x${base16Encode(bytes)}`;
}
