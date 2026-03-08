/**
 * RSA entry point — Node.js only.
 *
 * Import as `@decentralchain/ts-lib-crypto/rsa` when you need RSA
 * key‑generation, signing, or verification. This is kept separate from the
 * main bundle to avoid pulling `node:crypto` into browser builds.
 */

export type { RSADigestAlgorithm, TRSAKeyPair } from './crypto/interface';
export { pemToBytes, rsaKeyPair, rsaKeyPairSync, rsaSign, rsaVerify } from './crypto/rsa';
