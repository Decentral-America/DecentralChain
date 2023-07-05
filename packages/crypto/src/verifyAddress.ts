import { blake2b } from './blake2b.js';
import { keccak } from './keccak.js';

export function verifyAddress(
  bytes: Uint8Array,
  {
    chainId: expectedChainId,
    publicKey: expectedPublicKey,
  }: { chainId?: number; publicKey?: Uint8Array } = {},
) {
  return (
    bytes.length === 26 &&
    bytes[0] === 1 &&
    (expectedChainId == null || bytes[1] === expectedChainId) &&
    (expectedPublicKey == null ||
      keccak(blake2b(expectedPublicKey))
        .subarray(0, 20)
        .every((b, i) => bytes[2 + i] === b)) &&
    keccak(blake2b(bytes.subarray(0, 22)))
      .subarray(0, 4)
      .every((b, i) => bytes[22 + i] === b)
  );
}
