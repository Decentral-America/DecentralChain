/**
 * RSA entry point — Node.js only.
 *
 * Import as `@decentralchain/ts-lib-crypto/rsa` when you need RSA
 * key‑generation, signing, or verification. This is kept separate from the
 * main bundle to avoid pulling `node:crypto` into browser builds.
 */
export { rsaKeyPair, rsaKeyPairSync, rsaSign, rsaVerify, pemToBytes } from './crypto/rsa';
export type { TRSAKeyPair, RSADigestAlgorithm } from './crypto/interface';
