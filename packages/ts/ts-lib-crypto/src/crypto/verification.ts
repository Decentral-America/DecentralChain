import { _fromIn } from '../conversions/param';
import { ChainId } from '../extensions/chain-id';
import curve25519 from '../libs/curve25519';
import { address } from './address-keys-seed';
import { _hashChain } from './hashing';
import { ADDRESS_LENGTH, PUBLIC_KEY_LENGTH, type TBinaryIn, type TChainId } from './interface';

function isChecksumValid(addressBytes: Uint8Array): boolean {
  const keyHash = _hashChain(addressBytes.slice(0, 22)).slice(0, 4);
  const check = addressBytes.slice(22, 26);
  for (let i = 0; i < 4; i++) {
    if (check[i] !== keyHash[i]) return false;
  }
  return true;
}

function isPublicKeyMatch(
  addressBytes: Uint8Array,
  publicKey: TBinaryIn,
  chainId: TChainId | undefined,
): boolean {
  const expected = address({ publicKey }, chainId);
  if (addressBytes.length !== expected.length) return false;
  for (let i = 0; i < expected.length; i++) {
    if (addressBytes[i] !== expected[i]) return false;
  }
  return true;
}

/** Verify a DecentralChain address against optional chain ID and public key. */
export const verifyAddress = (
  addr: TBinaryIn,
  optional?: { chainId?: TChainId; publicKey?: TBinaryIn },
): boolean => {
  const chainId = optional?.chainId;

  try {
    const addressBytes = _fromIn(addr);

    if (addressBytes.length !== ADDRESS_LENGTH) return false;

    if (addressBytes[0] !== 1 || (chainId != null && addressBytes[1] !== ChainId.toNumber(chainId)))
      return false;

    if (!isChecksumValid(addressBytes)) return false;

    if (optional?.publicKey && !isPublicKeyMatch(addressBytes, optional.publicKey, chainId))
      return false;
  } catch (_ex) {
    return false;
  }

  return true;
};

/** Verify an Ed25519/Curve25519 signature against a public key and message. */
export const verifySignature = (
  publicKey: TBinaryIn,
  bytes: TBinaryIn,
  signature: TBinaryIn,
): boolean => {
  try {
    return curve25519.verify(_fromIn(publicKey), _fromIn(bytes), _fromIn(signature));
  } catch (_error) {
    return false;
  }
};

/** Verify that a public key has the correct length (32 bytes). */
export const verifyPublicKey = (publicKey: TBinaryIn): boolean =>
  _fromIn(publicKey).length === PUBLIC_KEY_LENGTH;
