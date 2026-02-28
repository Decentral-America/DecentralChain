import { type TBinaryIn, type TChainId, PUBLIC_KEY_LENGTH } from './interface';
import { ChainId } from '../extensions/chain-id';
import { _fromIn } from '../conversions/param';
import { _hashChain } from './hashing';
import { address } from './address-keys-seed';
import axlsign from '../libs/axlsign';

/** Verify a DecentralChain address against optional chain ID and public key. */
export const verifyAddress = (
  addr: TBinaryIn,
  optional?: { chainId?: TChainId; publicKey?: TBinaryIn },
): boolean => {
  const chainId = optional ? optional.chainId : undefined;

  try {
    const addressBytes = _fromIn(addr);

    if (addressBytes[0] != 1 || (chainId ? addressBytes[1] != ChainId.toNumber(chainId) : false))
      return false;

    const key = addressBytes.slice(0, 22);
    const check = addressBytes.slice(22, 26);
    const keyHash = _hashChain(key).slice(0, 4);

    for (let i = 0; i < 4; i++) {
      if (check[i] != keyHash[i]) return false;
    }

    if (optional?.publicKey) {
      const a = address({ publicKey: optional.publicKey }, chainId);
      if (addressBytes.length !== a.length) return false;

      for (let i = 0; i < a.length; i++) {
        if (a[i] !== addressBytes[i]) return false;
      }
    }
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
    return axlsign.verify(_fromIn(publicKey), _fromIn(bytes), _fromIn(signature));
  } catch (_error) {
    return false;
  }
};

/** Verify that a public key has the correct length (32 bytes). */
export const verifyPublicKey = (publicKey: TBinaryIn): boolean =>
  _fromIn(publicKey).length === PUBLIC_KEY_LENGTH;
