import { type TBinaryIn, type TPublicKey, type TPrivateKey } from './interface';

/** Type guard: check if a value is a `TPublicKey` wrapper. */
export const isPublicKey = <T extends TBinaryIn>(val: any): val is TPublicKey<T> =>
  val.publicKey !== undefined;

/** Type guard: check if a value is a `TPrivateKey` wrapper. */
export const isPrivateKey = <T extends TBinaryIn>(val: any): val is TPrivateKey<T> =>
  val.privateKey !== undefined;
