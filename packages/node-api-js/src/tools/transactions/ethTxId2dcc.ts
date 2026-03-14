import { base16Decode, base58Encode } from '@decentralchain/ts-lib-crypto';

const HEX_RE = /^(?:0x)?[0-9a-fA-F]+$/;

/** Convert an Ethereum transaction ID (hex) to DCC format (base58). */
export default function ethTxId2dcc(ethTxId: string): string {
  if (typeof ethTxId !== 'string' || !HEX_RE.test(ethTxId)) {
    throw new TypeError(
      `Invalid Ethereum TX ID: expected hex string (optionally 0x-prefixed), received ${typeof ethTxId === 'string' ? `"${ethTxId}"` : String(ethTxId)}`,
    );
  }

  const id = ethTxId.startsWith('0x') ? ethTxId.slice(2) : ethTxId;

  // Hex string must have even length to decode cleanly into bytes
  if (id.length % 2 !== 0) {
    throw new TypeError(
      `Invalid Ethereum TX ID: hex string must have even length, got ${String(id.length)} characters`,
    );
  }

  return base58Encode(base16Decode(id));
}
