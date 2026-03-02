import { type TransactionMap, type Transaction } from '@decentralchain/ts-types';
import { type TLong } from '../interface';

/**
 * Encode a value for safe interpolation into a URL path segment.
 *
 * Prevents path traversal attacks where a crafted value like
 * `"foo/../../admin/secret"` would escape the intended API route
 * after URL normalisation.
 *
 * Uses `encodeURIComponent` (encodes `/`, `?`, `#`, `&`, `=`, etc.)
 * so the value always stays within a single path segment.
 */
export function pathSegment(value: string | number): string {
  return encodeURIComponent(String(value));
}

export function isObject(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj === 'object' && obj !== null) {
    if (typeof Object.getPrototypeOf === 'function') {
      const prototype: unknown = Object.getPrototypeOf(obj);
      return prototype === Object.prototype || prototype === null;
    }

    return Object.prototype.toString.call(obj) === '[object Object]';
  }

  return false;
}

export function toArray<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}

export function head<T>(data: T[]): T | undefined {
  return data[0];
}

export function wait(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

export function prop<T extends object, P extends keyof T>(key: P): (data: T) => T[P] {
  return (data) => data[key];
}

export const keys = <T extends object>(obj: T): (keyof T)[] =>
  Object.keys(obj) as (keyof T)[];

export const entries = <T extends object>(obj: T): [keyof T, T[keyof T]][] =>
  keys(obj).map((name) => [name, obj[name]]);

export const values = <T extends object>(obj: T): T[keyof T][] =>
  keys(obj).map((key) => obj[key]);

export const deepAssign = <T extends object[]>(
  ...objects: T
): TUnionToIntersection<T[number]> =>
  objects.reduce<Record<string, unknown>>((target, merge) => {
    const result: Record<string, unknown> = { ...target };
    keys(merge).forEach((key) => {
      const resultVal: unknown = result[key as string];
      const mergeVal: unknown = merge[key];
      if (Array.isArray(resultVal) && Array.isArray(mergeVal)) {
        result[key as string] = Array.from(
          new Set((resultVal as unknown[]).concat(mergeVal as unknown[])),
        );
      } else if (isObject(resultVal) && isObject(mergeVal)) {
        result[key as string] = deepAssign(resultVal, mergeVal);
      } else {
        result[key as string] = mergeVal;
      }
    });

    return result;
  }, {}) as TUnionToIntersection<T[number]>;

export function map<T, U>(process: (data: T, index: number) => U): (list: T[]) => U[] {
  return (list) => list.map(process);
}

export function filter<T>(process: (data: T, index: number) => boolean): (list: T[]) => T[];
export function filter<T, S extends T>(
  process: (data: T, index: number) => data is S,
): (list: T[]) => S[];
export function filter<T>(process: (data: T, index: number) => boolean): (list: T[]) => T[] {
  return (list) => list.filter(process);
}

export function indexBy<T extends object>(
  process: (data: T) => string | number,
  data: T[],
): Record<string | number, T> {
  return data.reduce<Record<string | number, T>>(
    (acc, item) => {
      acc[process(item)] = item;
      return acc;
    },
    {},
  );
}

export const uniq = (list: (string | null)[]): (string | null)[] => {
  const hasNull = list.includes(null);
  const strings = [...new Set(list.filter((item): item is string => item !== null))];
  const result: (string | null)[] = strings;
  if (hasNull) result.push(null);
  return result;
};

type TChoices = {
  [Key in keyof TransactionMap<TLong>]?: (data: TransactionMap<TLong>[Key]) => unknown;
};

export type ISwitchTransactionResult<R extends TChoices> = <T extends Transaction<TLong>>(
  tx: T,
) => R[T['type']] extends (data: TransactionMap<TLong>[T['type']]) => infer A ? A : undefined;

export function switchTransactionByType<R extends TChoices>(
  choices: R,
): ISwitchTransactionResult<R> {
  return ((tx: Transaction<TLong>) => {
    const handler = choices[tx.type];
    if (handler != null) {
      return (handler as (data: Transaction<TLong>) => unknown)(tx);
    }
    return undefined;
  }) as ISwitchTransactionResult<R>;
}

export const pipe: IPipe = ((...args: readonly ((data: never) => unknown)[]) => {
  return (data: unknown) => args.reduce<unknown>((acc, item) => item(acc as never), data);
}) as IPipe;

export interface IPipe {
  <A, B, R>(a: (data: A) => B, b: (data: B) => R): (a: A) => R;

  <A, B, C, R>(a: (data: A) => B, b: (data: B) => C, c: (data: C) => R): (a: A) => R;

  <A, B, C, D, R>(
    a: (data: A) => B,
    b: (data: B) => C,
    c: (data: C) => D,
    d: (data: D) => R,
  ): (a: A) => R;
}

export type TUnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;
