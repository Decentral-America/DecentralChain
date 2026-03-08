import { crypto } from './crypto/crypto';

export { crypto } from './crypto/crypto';
export * from './crypto/interface';
export { seedWordsList } from './crypto/seed-words-list';
export { isPrivateKey, isPublicKey } from './crypto/util';
export { ChainId } from './extensions/chain-id';
export { Seed } from './extensions/seed';

export const {
  signBytes,
  keyPair,
  publicKey,
  privateKey,
  address,
  buildAddress,
  blake2b,
  keccak,
  sha256,
  sharedKey,
  seedWithNonce,
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
} = crypto({ output: 'Base58' });
