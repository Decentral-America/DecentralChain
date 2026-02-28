// @ts-expect-error -- no type declarations for node-forge submodule
import { encode64, decode64, hexToBytes, bytesToHex } from 'node-forge/lib/util';
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
export const base16Decode = (input: TBase16): TBytes => stringToBytes(hexToBytes(input), 'raw');

/** Encode binary input as a hex (Base16) string. */
export const base16Encode = (input: TBinaryIn): TBase16 =>
  bytesToHex(bytesToString(_fromIn(input), 'raw'));
