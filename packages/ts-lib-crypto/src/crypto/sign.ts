import { _fromIn } from '../conversions/param';
import curve25519 from '../libs/curve25519';
import { privateKey } from './address-keys-seed';
import { type TBinaryIn, type TBytes, type TPrivateKey, type TSeed } from './interface';
import { randomBytes } from './random';
import { isPrivateKey } from './util';

/** Sign bytes with a seed or private key using Curve25519. */
export const signBytes = (
  seedOrPrivateKey: TSeed | TPrivateKey<TBinaryIn>,
  bytes: TBinaryIn,
  random?: TBinaryIn,
): TBytes =>
  curve25519.sign(
    _fromIn(
      isPrivateKey(seedOrPrivateKey) ? seedOrPrivateKey.privateKey : privateKey(seedOrPrivateKey),
    ),
    _fromIn(bytes),
    _fromIn(random ?? randomBytes(64)),
  );
