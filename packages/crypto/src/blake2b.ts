import { blake2b as nobleBlake2b } from '@noble/hashes/blake2b';

export function blake2b(input: Uint8Array) {
  return nobleBlake2b(input, { dkLen: 32 });
}
