import base58 from './libs/base58';
import * as Base64 from 'base64-js';
import { concat } from './libs/utils';
import Long from 'long';

const textEncoder = new TextEncoder();
const stringToUint8Array = (str: string) => textEncoder.encode(str);

type Option<T> = T | null | undefined;

export type TSerializer<T> = (value: T) => Uint8Array;

export const empty: Uint8Array = new Uint8Array(0);
export const zero: Uint8Array = new Uint8Array([0]);
export const one: Uint8Array = new Uint8Array([1]);

export const BASE58_STRING: TSerializer<string> = (value: string) => base58.decode(value);

export const BASE64_STRING: TSerializer<string> = (value: string) =>
  Base64.toByteArray(value.replace('base64:', ''));

export const STRING: TSerializer<Option<string>> = (value: Option<string>) =>
  value ? stringToUint8Array(value) : empty;

export const BYTE: TSerializer<number> = (value: number) => Uint8Array.from([value]);

export const BOOL: TSerializer<boolean> = (value: boolean) => BYTE(value ? 1 : 0);

export const BYTES: TSerializer<Uint8Array | number[]> = (value: Uint8Array | number[]) =>
  Uint8Array.from(value);

export const SHORT: TSerializer<number> = (value: number) => {
  const s = Long.fromNumber(value, true);
  return Uint8Array.from(s.toBytesBE().slice(6));
};

export const INT: TSerializer<number> = (value: number) => {
  const i = Long.fromNumber(value, true);
  return Uint8Array.from(i.toBytesBE().slice(4));
};

export const OPTION =
  <T, R = T | null | undefined>(s: TSerializer<T>): TSerializer<R> =>
  (value: R) =>
    value == null || (typeof value === 'string' && value.length === 0)
      ? zero
      : concat(one, s(value as any));

export const LEN =
  (lenSerializer: TSerializer<number>) =>
  <T>(valueSerializer: TSerializer<T>): TSerializer<T> =>
  (value: T) => {
    const data = valueSerializer(value);
    const len = lenSerializer(data.length);
    return concat(len, data);
  };

export const COUNT =
  (countSerializer: TSerializer<number>) =>
  <T>(itemSerializer: TSerializer<T>) =>
  (items: T[]) => {
    const data = concat(...items.map((x) => itemSerializer(x)));
    const len = countSerializer(items.length);
    return concat(len, data);
  };

export const LONG: TSerializer<number | string> = (value: number | string) => {
  let l: Long;
  if (typeof value === 'number') {
    if (value > 2 ** 53 - 1) {
      throw new Error(
        `${value} is too big to be precisely represented as js number. Use string instead`,
      );
    }
    l = Long.fromNumber(value);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion -- value may be a Long object at runtime
    l = Long.fromString(String(value));
  }
  return Uint8Array.from(l.toBytesBE());
};

export const SCRIPT: TSerializer<string | null> = (script) =>
  OPTION(LEN(SHORT)(BASE64_STRING))(script ? script.slice(7) : null);

export const ALIAS: TSerializer<string> = (val) => {
  const [, byte, alias] = val.split(':');
  if (byte?.length !== 1) throw new Error('Invalid network byte in alias');
  if (!alias || alias.length === 0) throw new Error('Invalid alias body');
  return concat([2], [byte.charCodeAt(0)], LEN(SHORT)(STRING)(alias));
};

export const ADDRESS_OR_ALIAS: TSerializer<string> = (val) =>
  val.startsWith('alias') ? ALIAS(val) : BASE58_STRING(val);
