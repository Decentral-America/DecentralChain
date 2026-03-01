import { type TBytes, type TRandomTypesMap } from './interface';
import { seedWordsList } from './seed-words-list';

/**
 * Generate cryptographically secure random bytes using the platform CSPRNG.
 * Uses `globalThis.crypto.getRandomValues()` — available in Node 19+ and all modern browsers.
 */
const _random = (count: number): Uint8Array => {
  const buf = new Uint8Array(count);
  globalThis.crypto.getRandomValues(buf);
  return buf;
};

/** Generate random data of the specified length and return type. */
export const random = <T extends keyof TRandomTypesMap>(
  count: number,
  type: T,
): TRandomTypesMap[T] => {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError(`Count must be a non-negative integer, got ${count}`);
  }
  switch (type) {
    case 'Array8':
      return Array.from(_random(count)) as TRandomTypesMap[T];
    case 'Array16':
      return Array.from(random(count, 'Uint16Array')) as TRandomTypesMap[T];
    case 'Array32':
      return Array.from(random(count, 'Uint32Array')) as TRandomTypesMap[T];
    case 'Buffer':
      return Buffer.from(_random(count)) as TRandomTypesMap[T];
    case 'Uint8Array':
      return _random(count) as TRandomTypesMap[T];
    case 'Uint16Array': {
      const u16 = new Uint16Array(count);
      for (let i = 0; i < count; i++) {
        const bytes = _random(2);
        u16[i] = (bytes[0]! << 8) | bytes[1]!;
      }
      return u16 as TRandomTypesMap[T];
    }
    case 'Uint32Array': {
      const u32 = new Uint32Array(count);
      for (let i = 0; i < count; i++) {
        const bytes = _random(4);
        u32[i] = ((bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) >>> 0;
      }
      return u32 as TRandomTypesMap[T];
    }
    default:
      throw new TypeError(
        `Unsupported random type: ${type}. Expected one of: Array8, Array16, Array32, Buffer, Uint8Array, Uint16Array, Uint32Array`,
      );
  }
};

/** Generate the specified number of random bytes as a `Uint8Array`. */
export const randomBytes = (length: number): TBytes => {
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError(`randomBytes length must be a positive integer, got ${length}`);
  }
  return random(length, 'Uint8Array');
};

/** Generate a random mnemonic seed phrase (default: 15 words). */
export const randomSeed = (wordsCount = 15): string => {
  if (!Number.isInteger(wordsCount) || wordsCount < 1 || wordsCount > 24) {
    throw new RangeError(`wordsCount must be an integer in [1, 24], got ${wordsCount}`);
  }
  return random(wordsCount, 'Array32')
    .map((x) => seedWordsList[x % seedWordsList.length])
    .join(' ');
};
