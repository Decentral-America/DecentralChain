import {
  type TSeed,
  type INonceSeed,
  type TBytes,
  type TChainId,
  MAIN_NET_CHAIN_ID,
  type TPublicKey,
  type TBinaryIn,
  type TKeyPair,
  type TPrivateKey,
} from './interface';
import { Seed } from '../extensions/seed';
import { _hashChain, sha256 } from './hashing';
import { _fromIn } from '../conversions/param';
import { concat } from './concat-split';
import { isPublicKey, isPrivateKey } from './util';
import curve25519 from '../libs/curve25519';

/** Create a seed-with-nonce pair for deterministic key derivation. */
export const seedWithNonce = (seed: TSeed, nonce: number): INonceSeed => ({
  seed: Seed.toBinary(seed).seed,
  nonce,
});

/** Build a DecentralChain address from raw public key bytes and chain ID. */
export const buildAddress = (
  publicKeyBytes: TBytes,
  chainId: TChainId = MAIN_NET_CHAIN_ID,
): TBytes => {
  const prefix = [1, typeof chainId === 'string' ? chainId.charCodeAt(0) : chainId];
  const publicKeyHashPart = _hashChain(publicKeyBytes).slice(0, 20);
  const rawAddress = concat(prefix, publicKeyHashPart);
  const addressHash = _hashChain(rawAddress).slice(0, 4);
  return concat(rawAddress, addressHash);
};

const buildSeedHash = (seedBytes: Uint8Array, nonce?: number): TBytes => {
  const nonceArray = [0, 0, 0, 0];
  if (nonce !== undefined && nonce !== 0) {
    if (!Number.isInteger(nonce) || nonce < 0 || nonce > 0xffffffff) {
      throw new RangeError(`Nonce must be an integer in [0, 2^32 - 1], got ${nonce}`);
    }
    nonceArray[0] = (nonce >>> 24) & 0xff;
    nonceArray[1] = (nonce >>> 16) & 0xff;
    nonceArray[2] = (nonce >>> 8) & 0xff;
    nonceArray[3] = nonce & 0xff;
  }
  const seedBytesWithNonce = concat(nonceArray, seedBytes);
  const seedHash = _hashChain(seedBytesWithNonce);
  return sha256(seedHash);
};

/** Derive an Ed25519/Curve25519 key pair from a seed. */
export const keyPair = (seed: TSeed): TKeyPair<TBytes> => {
  const { seed: seedBytes, nonce } = Seed.toBinary(seed);

  const seedHash = buildSeedHash(seedBytes, nonce);
  const keys = curve25519.generateKeyPair(seedHash);

  return {
    privateKey: keys.private,
    publicKey: keys.public,
  };
};

/** Derive a DecentralChain address from a seed or public key. */
export const address = (
  seedOrPublicKey: TSeed | TPublicKey<TBinaryIn>,
  chainId: TChainId = MAIN_NET_CHAIN_ID,
): TBytes =>
  isPublicKey(seedOrPublicKey)
    ? buildAddress(_fromIn(seedOrPublicKey.publicKey), chainId)
    : address(keyPair(seedOrPublicKey), chainId);

/** Derive the public key from a seed or private key. */
export const publicKey = (seedOrPrivateKey: TSeed | TPrivateKey<TBinaryIn>): TBytes =>
  isPrivateKey(seedOrPrivateKey)
    ? curve25519.generateKeyPair(_fromIn(seedOrPrivateKey.privateKey)).public
    : keyPair(seedOrPrivateKey).publicKey;

/** Derive the private key from a seed. */
export const privateKey = (seed: TSeed): TBytes => keyPair(seed).privateKey;
