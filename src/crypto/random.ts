// @ts-expect-error -- no type declarations for node-forge submodule
import forgeRand from 'node-forge/lib/random';
import { type TBytes, type TRandomTypesMap } from './interface';
import { seedWordsList } from './seed-words-list';
import { stringToBytes } from '../conversions/string-bytes';

const _random = (count: number) => stringToBytes(forgeRand.getBytesSync(count), 'raw');

/** Generate random data in the specified typed format. */
/** Generate random data of the specified length and return type. */
export const random = <T extends keyof TRandomTypesMap>(
  count: number,
  type: T,
): TRandomTypesMap[T] => {
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
    case 'Uint16Array':
      return new Uint16Array(count).map((_) =>
        _random(2).reduce((a, b, i) => a | (b << (8 * (1 - i))), 0),
      ) as TRandomTypesMap[T];
    case 'Uint32Array':
      return new Uint32Array(count).map((_) =>
        _random(4).reduce((a, b, i) => a | (b << (8 * (1 - i))), 0),
      ) as TRandomTypesMap[T];
    default:
      throw new TypeError(
        `Unsupported random type: ${type}. Expected one of: Array8, Array16, Array32, Buffer, Uint8Array, Uint16Array, Uint32Array`,
      );
  }
};

/** Generate the specified number of random bytes as a `Uint8Array`. */
export const randomBytes = (length: number): TBytes => random(length, 'Uint8Array');

/** Generate a random mnemonic seed phrase (default: 15 words). */
export const randomSeed = (wordsCount = 15): string =>
  random(wordsCount, 'Array32')
    .map((x) => seedWordsList[x % seedWordsList.length])
    .join(' ');
