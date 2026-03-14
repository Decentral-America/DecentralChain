import { base16Encode, base58Decode } from '@decentralchain/ts-lib-crypto';

/** Convert a DCC address to its Ethereum-compatible hex representation. */
export default function dccAddress2eth(dccAddress: string): string {
  if (typeof dccAddress !== 'string' || dccAddress.length === 0) {
    throw new TypeError(
      `Invalid DCC address: expected non-empty string, received ${typeof dccAddress === 'string' ? `"${dccAddress}"` : String(dccAddress)}`,
    );
  }

  const rawBytes = base58Decode(dccAddress);

  // A valid DCC address is 26 bytes: 1 version + 1 chain-id + 20 hash + 4 checksum
  if (rawBytes.byteLength !== 26) {
    throw new TypeError(
      `Invalid DCC address: expected 26 decoded bytes, got ${String(rawBytes.byteLength)}`,
    );
  }

  // Strip the 2-byte prefix (version + chain ID) and 4-byte checksum
  const bytes = rawBytes.slice(2, rawBytes.byteLength - 4);

  return `0x${base16Encode(bytes)}`;
}
