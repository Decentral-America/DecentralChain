import { blake2b } from './blake2b.js';
import { keccak } from './keccak.js';

export function createAddress(publicKey: Uint8Array, chainId = 87) {
  const bytes = new Uint8Array(26);
  bytes.set([1, chainId], 0);
  bytes.set(keccak(blake2b(publicKey)).subarray(0, 20), 2);
  bytes.set(keccak(blake2b(bytes.subarray(0, 22))).subarray(0, 4), 22);
  return bytes;
}
