import {
  base16Decode,
  base16Encode,
  base58Decode,
  base58Encode,
  base64Decode,
  base64Encode,
} from '../conversions/base-xx';
import { bytesToString, stringToBytes } from '../conversions/string-bytes';
import {
  address,
  buildAddress,
  keyPair,
  privateKey,
  publicKey,
  seedWithNonce,
} from './address-keys-seed';
import { blsKeyPair, blsPublicKey, blsSign, blsVerify } from './bls';
import { concat, split } from './concat-split';
import { aesDecrypt, aesEncrypt, messageDecrypt, messageEncrypt, sharedKey } from './encryption';
import { blake2b, keccak, sha256 } from './hashing';
import {
  type IDCCCrypto,
  type ISeedEmbeded,
  type ISeedRelated,
  type TBinaryOut,
  type TKeyPair,
  type TSeed,
} from './interface';
import { merkleVerify } from './merkle-verify';
import { random, randomBytes, randomSeed } from './random';
import { decryptSeed, encryptSeed } from './seed-ecryption';
import { signBytes } from './sign';
import { verifyAddress, verifyPublicKey, verifySignature } from './verification';

interface TOutputTypesMap {
  Bytes: Uint8Array;
  Base58: string;
}

type TDefaultOut = 'Base58';
type TOutput = keyof TOutputTypesMap;
interface TOptions<T extends TBinaryOut = TDefaultOut, S extends TSeed | undefined = undefined> {
  output?: T;
  seed?: S;
}
type TDCCCrypto<
  T extends TBinaryOut = TDefaultOut,
  S extends TSeed | undefined = undefined,
> = IDCCCrypto<T> & (S extends undefined ? ISeedRelated<T> : ISeedEmbeded<T>);

/** Create a configured crypto instance with optional output format and embedded seed. */
export const crypto = <TOut extends TOutput = TDefaultOut, S extends TSeed | undefined = undefined>(
  options?: TOptions<TOut, S>,
): TDCCCrypto<TOutputTypesMap[TOut], S> => {
  if (options?.seed === '') throw new Error('Empty seed is not allowed.');

  /*
   * TypeScript conditional type extraction requires `any` — using `unknown`
   * breaks distribution over union types. The `Function` constraint is needed
   * because generic callables cannot be narrowed through casts (TS2352).
   * These are inherent TypeScript limitations in higher-order generic wrappers.
   */
  // biome-ignore lint/suspicious/noExplicitAny: suppressed
  type ArgsFirstRest<TFunc> = TFunc extends (a: infer A, ...args: infer U) => any ? [A, U] : never;
  // biome-ignore lint/suspicious/noExplicitAny: conditional type inference requires any
  type ArgsAll<TFunc> = TFunc extends (...args: infer U) => any ? U : never;
  // biome-ignore lint/suspicious/noExplicitAny: conditional type inference requires any
  type Return<TFunc> = TFunc extends (...args: any) => infer R ? R : unknown;

  const c =
    // biome-ignore lint/complexity/noBannedTypes: generic callable constraint requires Function
      <TFunc extends Function>(f: TFunc, first: ArgsFirstRest<TFunc>[0]) =>
      (...args: ArgsFirstRest<TFunc>[1]) =>
        f(first, ...args) as Return<TFunc>;

  const toOut =
    // biome-ignore lint/complexity/noBannedTypes: generic callable constraint requires Function
      <F extends Function>(f: F) =>
      (...args: ArgsAll<F>): TOutputTypesMap[TOut] => {
        const r = f(...args);
        if (!options || options.output === 'Base58') {
          return base58Encode(r) as TOutputTypesMap[TOut];
        } else {
          return r as TOutputTypesMap[TOut];
        }
      };

  const toOutKey =
    // biome-ignore lint/complexity/noBannedTypes: generic callable constraint requires Function
      <F extends Function>(f: F) =>
      (...args: ArgsAll<F>): TKeyPair<TOutputTypesMap[TOut]> => {
        const r = f(...args) as TKeyPair;
        return (
          !options || options.output === 'Base58'
            ? { privateKey: base58Encode(r.privateKey), publicKey: base58Encode(r.publicKey) }
            : r
        ) as TKeyPair<TOutputTypesMap[TOut]>;
      };

  const s = options?.seed ?? undefined;

  const seedPart = {
    seedWithNonce: s ? c(seedWithNonce, s) : seedWithNonce,
    signBytes: toOut(s ? c(signBytes, s) : signBytes),
    keyPair: toOutKey(s ? c(keyPair, s) : keyPair),
    publicKey: toOut(s ? c(publicKey, s) : publicKey),
    privateKey: toOut(s ? c(privateKey, s) : privateKey),
    address: toOut(s ? c(address, s) : address),
  } as S extends undefined
    ? ISeedRelated<TOutputTypesMap[TOut]>
    : ISeedEmbeded<TOutputTypesMap[TOut]>;

  return {
    ...seedPart,
    sharedKey: toOut(sharedKey),
    buildAddress,
    blake2b,
    keccak,
    sha256,
    base64Encode,
    base64Decode,
    base58Encode,
    base58Decode,
    base16Encode,
    base16Decode,
    stringToBytes,
    bytesToString,
    random,
    randomSeed,
    randomBytes,
    verifySignature,
    verifyPublicKey,
    verifyAddress,
    messageDecrypt,
    messageEncrypt,
    aesDecrypt,
    aesEncrypt,
    encryptSeed,
    decryptSeed,
    merkleVerify,
    split,
    concat,
    blsKeyPair,
    blsPublicKey,
    blsSign,
    blsVerify,
  };
};
