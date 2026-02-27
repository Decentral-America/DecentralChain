import Long from 'long';
import base58 from './libs/base58';
import * as Base64 from 'base64-js';

const textDecoder = new TextDecoder();

export const ALIAS_VERSION: number = 2;

const LENGTH_SIZE = 2;

type Option<T> = T | null | undefined;

export type TParser<T> = (bytes: Uint8Array, start?: number) => { value: T; shift: number };

export const P_OPTION =
  <T>(p: TParser<T>): TParser<Option<T>> =>
  (bytes: Uint8Array, start = 0) => {
    if (bytes[start] === 0) return { value: null, shift: 1 };
    const result = p(bytes, start + 1);
    return { value: result.value, shift: result.shift + 1 };
  };

export const P_BYTE: TParser<number> = (bytes, start = 0) => ({ value: bytes[start], shift: 1 });

export const P_SHORT: TParser<number> = (bytes, start = 0) => ({
  value: 256 * bytes[start] + bytes[start + 1],
  shift: 2,
});

export const P_INT: TParser<number> = (bytes, start = 0) => ({
  value:
    2 ** 24 * bytes[start] +
    2 ** 16 * bytes[start + 1] +
    2 ** 8 * bytes[start + 2] +
    bytes[start + 3],
  shift: 4,
});

export const P_LONG: TParser<string> = (bytes, start = 0) => ({
  value: Long.fromBytesBE(Array.from(bytes.slice(start, start + 8))).toString(),
  shift: 8,
});

export const P_BOOLEAN = (bytes: Uint8Array, start = 0) => {
  const value = !!bytes[start];
  return { value, shift: 1 };
};

export const P_STRING_FIXED =
  (len: number): TParser<string> =>
  (bytes: Uint8Array, start: number = 0) => {
    const value = textDecoder.decode(bytes.slice(start, start + len));
    return { shift: len, value };
  };

export const P_STRING_VAR =
  (lenParser: TParser<number>) =>
  (bytes: Uint8Array, start: number = 0) => {
    const lengthInfo = lenParser(bytes, start);
    const { value } = P_STRING_FIXED(lengthInfo.value)(bytes, start + lengthInfo.shift);
    return { shift: lengthInfo.value + lengthInfo.shift, value };
  };

export const P_BASE58_FIXED =
  (len: number): TParser<string> =>
  (bytes: Uint8Array, start: number = 0) => {
    const value = base58.encode(bytes.slice(start, start + len));
    return { value, shift: len };
  };

export const P_BASE58_VAR =
  (lenParser: TParser<number>) =>
  (bytes: Uint8Array, start: number = 0) => {
    const lengthInfo = lenParser(bytes, start);
    const { value } = P_BASE58_FIXED(lengthInfo.value)(bytes, start + LENGTH_SIZE);
    return { shift: lengthInfo.value + LENGTH_SIZE, value };
  };

export const P_BASE64 =
  (lenParser: TParser<number>) =>
  (bytes: Uint8Array, start: number = 0) => {
    const lengthInfo = lenParser(bytes, start);
    const value = `base64:${Base64.fromByteArray(bytes.slice(start + lengthInfo.shift, start + lengthInfo.shift + lengthInfo.value))}`;
    return { shift: lengthInfo.value + lengthInfo.shift, value };
  };

const byteToString = (shift: number) => (bytes: Uint8Array, start: number) => {
  const value = textDecoder.decode(bytes.slice(start, start + shift));
  return { shift, value };
};

export const byteToStringWithLength = (bytes: Uint8Array, start: number = 0) => {
  const lengthInfo = P_SHORT(bytes, start);
  const { value } = byteToString(lengthInfo.value)(bytes, start + LENGTH_SIZE);
  return { shift: lengthInfo.value + LENGTH_SIZE, value };
};

export const byteToBase58 = (bytes: Uint8Array, start: number = 0, length?: number) => {
  const shift = length || 32;
  const value = base58.encode(bytes.slice(start, start + shift));
  return { value, shift };
};
export const byteToAddressOrAlias = (bytes: Uint8Array, start: number = 0) => {
  if (bytes[start] === ALIAS_VERSION) {
    const aliasData = byteToStringWithLength(bytes, start + 2);
    return {
      shift: aliasData.shift + 2,
      value: `alias:${String.fromCharCode(bytes[start + 1])}:${aliasData.value}`,
    };
  } else {
    return byteToBase58(bytes, start, 26);
  }
};

export const byteNewAliasToString = (bytes: Uint8Array, start: number = 0) => {
  const shift = P_SHORT(bytes, start).value + LENGTH_SIZE;
  const { value } = byteToStringWithLength(bytes, start);
  return { shift, value };
};

export const byteToScript = (bytes: Uint8Array, start: number = 0) => {
  const VERSION_LENGTH = 1;

  if (bytes[start] === 0) {
    return { shift: VERSION_LENGTH, value: null };
  }

  const lengthInfo = P_SHORT(bytes, start + VERSION_LENGTH);
  const from = start + VERSION_LENGTH + lengthInfo.shift;
  const to = start + VERSION_LENGTH + lengthInfo.shift + lengthInfo.value;
  const value = `base64:${Base64.fromByteArray(bytes.slice(from, to))}`;

  return { value, shift: to - start };
};
