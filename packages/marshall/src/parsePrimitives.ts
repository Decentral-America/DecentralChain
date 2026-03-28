import * as Base64 from 'base64-js';
import Long from 'long';
import base58 from './libs/base58';

const textDecoder = new TextDecoder();

export const ALIAS_VERSION: number = 2;

const LENGTH_SIZE = 2;

type Option<T> = T | null | undefined;

export type TParser<T> = (bytes: Uint8Array, start?: number) => { value: T; shift: number };

export const P_OPTION =
  <T>(p: TParser<T>): TParser<Option<T>> =>
  (bytes: Uint8Array, start = 0) => {
    if (bytes[start] === 0) return { shift: 1, value: null };
    const result = p(bytes, start + 1);
    return { shift: result.shift + 1, value: result.value };
  };

export const P_BYTE: TParser<number> = (bytes, start = 0) => {
  if (start >= bytes.length) {
    throw new Error(`P_BYTE: buffer underflow at offset ${start} (length ${bytes.length})`);
  }
  return { shift: 1, value: bytes[start] as number };
};

export const P_SHORT: TParser<number> = (bytes, start = 0) => {
  if (start + 1 >= bytes.length) {
    throw new Error(`P_SHORT: buffer underflow at offset ${start} (length ${bytes.length})`);
  }
  return {
    shift: 2,
    value: 256 * (bytes[start] as number) + (bytes[start + 1] as number),
  };
};

export const P_INT: TParser<number> = (bytes, start = 0) => {
  if (start + 3 >= bytes.length) {
    throw new Error(`P_INT: buffer underflow at offset ${start} (length ${bytes.length})`);
  }
  return {
    shift: 4,
    value:
      2 ** 24 * (bytes[start] as number) +
      2 ** 16 * (bytes[start + 1] as number) +
      2 ** 8 * (bytes[start + 2] as number) +
      (bytes[start + 3] as number),
  };
};

export const P_LONG: TParser<string> = (bytes, start = 0) => {
  if (start + 7 >= bytes.length) {
    throw new Error(`P_LONG: buffer underflow at offset ${start} (length ${bytes.length})`);
  }
  return {
    shift: 8,
    value: Long.fromBytesBE(Array.from(bytes.slice(start, start + 8))).toString(),
  };
};

export const P_BOOLEAN = (bytes: Uint8Array, start = 0) => {
  if (start >= bytes.length) {
    throw new Error(`P_BOOLEAN: buffer underflow at offset ${start} (length ${bytes.length})`);
  }
  const raw = bytes[start] as number;
  if (raw !== 0 && raw !== 1) {
    throw new Error(`P_BOOLEAN: invalid boolean byte ${raw} at offset ${start} (expected 0 or 1)`);
  }
  return { shift: 1, value: raw === 1 };
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
    return { shift: len, value };
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
  const shift = length ?? 32;
  const value = base58.encode(bytes.slice(start, start + shift));
  return { shift, value };
};
export const byteToAddressOrAlias = (bytes: Uint8Array, start: number = 0) => {
  if (bytes[start] === ALIAS_VERSION) {
    const aliasData = byteToStringWithLength(bytes, start + 2);
    return {
      shift: aliasData.shift + 2,
      value: `alias:${String.fromCharCode(bytes[start + 1] as number)}:${aliasData.value}`,
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

  return { shift: to - start, value };
};
