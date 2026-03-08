const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET[i] as string] = i;
}

export default {
  encode(buffer: Uint8Array): string {
    if (!buffer.length) return '';

    const digits = [0];

    for (let i = 0; i < buffer.length; i++) {
      for (let j = 0; j < digits.length; j++) {
        (digits[j] as number) <<= 8;
      }

      (digits[0] as number) += buffer[i] as number;
      let carry = 0;

      for (let k = 0; k < digits.length; k++) {
        (digits[k] as number) += carry;
        carry = ((digits[k] as number) / 58) | 0;
        (digits[k] as number) %= 58;
      }

      while (carry) {
        digits.push(carry % 58);
        carry = (carry / 58) | 0;
      }
    }

    for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
      digits.push(0);
    }

    return digits
      .reverse()
      .map((digit) => ALPHABET[digit])
      .join('');
  },

  decode(string: string): Uint8Array {
    if (!string.length) return new Uint8Array(0);

    const bytes = [0];

    for (let i = 0; i < string.length; i++) {
      const c = string[i] as string;
      if (!(c in ALPHABET_MAP)) {
        throw new Error(`There is no character "${c}" in the Base58 sequence!`);
      }

      for (let j = 0; j < bytes.length; j++) {
        (bytes[j] as number) *= 58;
      }

      (bytes[0] as number) += ALPHABET_MAP[c] as number;
      let carry = 0;

      for (let j = 0; j < bytes.length; j++) {
        (bytes[j] as number) += carry;
        carry = (bytes[j] as number) >> 8;
        (bytes[j] as number) &= 0xff;
      }

      while (carry) {
        bytes.push(carry & 0xff);
        carry >>= 8;
      }
    }

    for (let i = 0; string[i] === '1' && i < string.length - 1; i++) {
      bytes.push(0);
    }

    return new Uint8Array(bytes.reverse());
  },
};
