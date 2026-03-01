import {
  type TBase64,
  type TBytes,
  type TBinaryIn,
  type TBase58,
  type TBase16,
} from '../crypto/interface';
import base58 from '../libs/base58';
import { _fromIn } from './param';
import { bytesToString, stringToBytes } from './string-bytes';

/* ── Base64 helpers (replaces node-forge/lib/util) ───────────────── */

function encode64(raw: string): string {
  return btoa(raw);
}

function decode64(b64: string): string {
  return atob(b64);
}

function hexToBinStr(hex: string): string {
  let out = '';
  for (let i = 0; i < hex.length; i += 2) {
    out += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
  }
  return out;
}

function binStrToHex(raw: string): string {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    out += raw.charCodeAt(i).toString(16).padStart(2, '0');
  }
  return out;
}

/** Decode a Base64 string to bytes. */
export const base64Decode = (input: TBase64): TBytes => stringToBytes(decode64(input), 'raw');

/** Encode binary input as a Base64 string. */
export const base64Encode = (input: TBinaryIn): TBase64 =>
  encode64(bytesToString(_fromIn(input), 'raw'));

/** Decode a Base58 string to bytes. */
export const base58Decode = (input: TBase58): TBytes => base58.decode(input);

/** Encode binary input as a Base58 string. */
export const base58Encode = (input: TBinaryIn): TBase58 => base58.encode(_fromIn(input));

/** Decode a hex (Base16) string to bytes. */
export const base16Decode = (input: TBase16): TBytes => stringToBytes(hexToBinStr(input), 'raw');

/** Encode binary input as a hex (Base16) string. */
export const base16Encode = (input: TBinaryIn): TBase16 =>
  binStrToHex(bytesToString(_fromIn(input), 'raw'));
