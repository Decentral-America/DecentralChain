import { type TBinaryIn, type TPublicKey, type TPrivateKey } from './interface';

/** Type guard: check if a value is a `TPublicKey` wrapper. */
export const isPublicKey = <T extends TBinaryIn>(val: unknown): val is TPublicKey<T> =>
  typeof val === 'object' && val !== null && 'publicKey' in val;

/** Type guard: check if a value is a `TPrivateKey` wrapper. */
export const isPrivateKey = <T extends TBinaryIn>(val: unknown): val is TPrivateKey<T> =>
  typeof val === 'object' && val !== null && 'privateKey' in val;
