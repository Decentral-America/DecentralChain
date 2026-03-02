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

function base58Decode(input: string): Uint8Array {
  if (input.length === 0) {
    return new Uint8Array(0);
  }
  const bytes: number[] = [0];

  for (let i = 0; i < input.length; i++) {
    const c = input.charAt(i);
    const charValue = ALPHABET_MAP[c];
    if (charValue === undefined) {
      throw new Error(
        "Base58.decode received unacceptable input. Character '" +
          c +
          "' is not in the Base58 alphabet.",
      );
    }
    for (let j = 0; j < bytes.length; j++) {
      bytes[j] = (bytes[j] ?? 0) * 58;
    }
    bytes[0] = (bytes[0] ?? 0) + charValue;
    let carry = 0;
    for (let j = 0; j < bytes.length; j++) {
      const sum = (bytes[j] ?? 0) + carry;
      carry = sum >> 8;
      bytes[j] = sum & 0xff;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let i = 0;
  while (input[i] === '1' && i < input.length - 1) {
    bytes.push(0);
    i++;
  }
  return new Uint8Array(bytes.reverse());
}
