import { fetchHeadersLast } from '../../api-node/blocks';

export default function (base: string): Promise<number> {
  return fetchHeadersLast(base).then((header) => {
    const decoded = base58Decode(header.generator);
    const byte = decoded[1];
    if (byte === undefined) {
      throw new Error('Unable to extract network byte: generator address too short');
    }
    return byte;
  });
}

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: Record<string, number> = {};

for (let i = 0; i < ALPHABET.length; i++) {
  const char = ALPHABET.charAt(i);
  ALPHABET_MAP[char] = i;
}

function base58Decode(string: string): Uint8Array {
  if (string.length === 0) {
    return new Uint8Array(0);
  }
  let carry: number, j: number;
  let i: number;
  const bytes: number[] = [0];
  i = 0;
  while (i < string.length) {
    const c = string[i]!;
    const charValue = ALPHABET_MAP[c];
    if (charValue === undefined) {
      throw new Error(
        "Base58.decode received unacceptable input. Character '" +
          c +
          "' is not in the Base58 alphabet.",
      );
    }
    j = 0;
    while (j < bytes.length) {
      bytes[j]! *= 58;
      j++;
    }
    bytes[0]! += charValue;
    carry = 0;
    j = 0;
    while (j < bytes.length) {
      bytes[j]! += carry;
      carry = bytes[j]! >> 8;
      bytes[j]! &= 0xff;
      ++j;
    }
    while (carry) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
    i++;
  }
  i = 0;
  while (string[i] === '1' && i < string.length - 1) {
    bytes.push(0);
    i++;
  }
  return new Uint8Array(bytes.reverse());
}
