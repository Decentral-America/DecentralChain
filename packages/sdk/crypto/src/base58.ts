import { base58 } from '@scure/base';

export function base58Decode(input: string) {
  return base58.decode(input);
}

export function base58Encode(input: Uint8Array) {
  return base58.encode(input);
}
