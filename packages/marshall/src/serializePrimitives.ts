import base58 from "./libs/base58";
import * as Base64 from "base64-js"
import * as Long from "long";
import {concat} from "./libs/utils";

const stringToUint8Array = (str: string) =>
  Uint8Array.from([...unescape(encodeURIComponent(str))].map(c => c.charCodeAt(0)))

type Option<T> = T | null | undefined

export type serializer<T> = (value: T) => Uint8Array

export const empty: Uint8Array = Uint8Array.from([]);
export const zero: Uint8Array = Uint8Array.from([0]);
export const one: Uint8Array = Uint8Array.from([1]);

export const BASE58_STRING: serializer<string> = (value: string) => base58.decode(value);

export const BASE64_STRING: serializer<string> = (value: string) => Base64.toByteArray(value);

export const STRING: serializer<Option<string>> = (value: Option<string>) => value ? stringToUint8Array(value) : empty;

export const BYTE: serializer<number> = (value: number) => Uint8Array.from([value]);

export const BOOL: serializer<boolean> = (value: boolean) => BYTE(value == true ? 1 : 0);

export const BYTES: serializer<Uint8Array | number[]> = (value: Uint8Array | number[]) => Uint8Array.from(value);

export const SHORT: serializer<number> = (value: number) => {
  const s = Long.fromNumber(value, true);
  return Uint8Array.from(s.toBytesBE().slice(6))
}
export const INT: serializer<number> = (value: number) => {
  const i = Long.fromNumber(value, true);
  return Uint8Array.from(i.toBytesBE().slice(4))
}
export const OPTION = <T, R = T | null | undefined>(s: serializer<T>): serializer<R> => (value: R) =>
  value == null
  || (typeof value == 'string' && value.length == 0)
    ? zero : concat(one, s(value as any));

export const LEN = (lenSerializer: serializer<number>) => <T>(valueSerializer: serializer<T>): serializer<T> => (value: T) => {
  const data = valueSerializer(value);
  const len = lenSerializer(data.length);
  return concat(len, data)
}

export const COUNT = (countSerializer: serializer<number>) => <T>(itemSerializer: serializer<T>) => (items: T[]) => {
  const data = concat(...items.map(x => itemSerializer(x)))
  const len = countSerializer(items.length)
  return concat(len, data)
}

export const LONG: serializer<number | string> = (value: number | string) => {
  let l: Long;
  if (typeof value === 'number') {
    if (value > 2 ** 53 - 1) {
      throw new Error(`${value} is too big to be precisely represented as js number. Use string instead`)
    }
    l = Long.fromNumber(value, true)
  } else {
    l = Long.fromString(value, true)
  }
  return Uint8Array.from(l.toBytesBE())
}

export const SCRIPT: serializer<string | null> = (script) => OPTION(LEN(SHORT)(BASE64_STRING))(script ? script.slice(7) : null);