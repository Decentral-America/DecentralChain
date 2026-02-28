import { type TSeed, type TPrivateKey, type TBinaryIn, type TBytes } from './interface';
import axlsign from '../libs/axlsign';
import { _fromIn } from '../conversions/param';
import { isPrivateKey } from './util';
import { privateKey } from './address-keys-seed';
import { randomBytes } from './random';

/** Sign bytes with a seed or private key using Curve25519. */
export const signBytes = (
  seedOrPrivateKey: TSeed | TPrivateKey<TBinaryIn>,
  bytes: TBinaryIn,
  random?: TBinaryIn,
): TBytes =>
  axlsign.sign(
    _fromIn(
      isPrivateKey(seedOrPrivateKey) ? seedOrPrivateKey.privateKey : privateKey(seedOrPrivateKey),
    ),
    _fromIn(bytes),
    _fromIn(random || randomBytes(64)),
  );
