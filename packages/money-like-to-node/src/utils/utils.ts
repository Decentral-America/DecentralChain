import { type TLong, type TMoney } from '../types/index.js';

export function getAssetId(money: TMoney): string;
export function getAssetId(money: TLong | null | undefined): null;
export function getAssetId(money: TMoney | TLong | null | undefined): string | null;
export function getAssetId(money: TMoney | TLong | null | undefined): string | null {
  if (!money || typeof money !== 'object') {
    return null;
  }

  if ('toCoins' in money) {
    return money.asset.id;
  } else if ('assetId' in money) {
    return money.assetId;
  } else {
    return null;
  }
}

export function getCoins(money: TMoney | TLong): string;
export function getCoins(money: null | undefined): null;
export function getCoins(money: TMoney | TLong | undefined | null): string | null;
export function getCoins(money: TMoney | TLong | undefined | null): string | null {
  let result: string;

  if (money == null) {
    return null;
  }

  if (typeof money === 'object') {
    if ('toCoins' in money) {
      result = money.toCoins();
    } else if ('toFixed' in money) {
      result = money.toFixed();
    } else {
      if (typeof money.coins === 'number' && !Number.isSafeInteger(money.coins)) {
        throw new Error(
          `Unsafe integer detected in coins: ${String(money.coins)}. ` +
            `Use string or BigNumber for values exceeding Number.MAX_SAFE_INTEGER (${String(Number.MAX_SAFE_INTEGER)}).`,
        );
      }
      result = String(money.coins);
    }
  } else {
    if (typeof money === 'number' && !Number.isSafeInteger(money)) {
      throw new Error(
        `Unsafe integer detected: ${String(money)}. ` +
          `Use string or BigNumber for values exceeding Number.MAX_SAFE_INTEGER (${String(Number.MAX_SAFE_INTEGER)}).`,
      );
    }
    result = String(money);
  }
  return result;
}

// biome-ignore lint/suspicious/noExplicitAny: ICurry overloads require any — typed interfaces provide safety at call sites
export const curry: ICurry = (func: (...args: any[]) => any) => {
  // biome-ignore lint/suspicious/noExplicitAny: curry implementation bridges generic overloads
  function loop(callback: (...args: any[]) => any, ...local: any[]) {
    if (callback.length <= local.length) {
      return callback(...local);
    } else {
      // biome-ignore lint/suspicious/noExplicitAny: curry partial application
      return (...args: any[]) => loop(func, ...local.concat(args));
    }
  }

  // biome-ignore lint/suspicious/noExplicitAny: curry partial application
  return (...args: any[]) => loop(func, ...args);
};

export const ifElse =
  <T, Y, N>(expression: (data: T) => boolean, resolve: (data: T) => Y, reject: (data: T) => N) =>
  (data: T): Y | N =>
    expression(data) ? resolve(data) : reject(data);

export const has: IHas = curry((prop: string | number | symbol, data: object): boolean =>
  Object.hasOwn(data, prop),
) as IHas;

export const emptyError =
  <T>(message: string) =>
  (value: T | null | undefined): T | never => {
    if (value == null) {
      throw new Error(message);
    }
    return value as T;
  };

export const length = (some: string | unknown[]): number => some.length;

export const lte: IComparator = curry((a: number, b: number) => a <= b) as IComparator;

export const gte: IComparator = curry((a: number, b: number) => a >= b) as IComparator;

export const isStopSponsorship = (a: number | string | undefined | null): boolean =>
  a == null || Number.isNaN(Number(a)) || Number(a) === 0;

export const head = <T>(list: T[]): T | undefined => list[0];

export const defaultTo =
  <T>(value: T) =>
  (data: T | null | undefined): T =>
    data ?? value;

export const map: IMap = curry(
  <T, R>(cb: (item: T) => R, list: T[]): R[] => list.map(cb),
  // biome-ignore lint/suspicious/noExplicitAny: curry returns generic — IMap overloads provide safety at call sites
) as any;

export const prop: IProp = curry(
  <T extends object, K extends keyof T>(key: K, data: T): T[K] => data[key],
  // biome-ignore lint/suspicious/noExplicitAny: curry returns generic — IProp overloads provide safety at call sites
) as any;

export const pipe: IPipe = (...processors: ((...args: unknown[]) => unknown)[]) =>
  // biome-ignore lint/suspicious/noExplicitAny: IPipe overloads provide safety — implementation must accept any initial value
  ((initial: any) => processors.reduce((acc, cb) => cb(acc), initial)) as any;

interface IComparator {
  (a: number, b: number): boolean;

  (a: number): (b: number) => boolean;
}

interface IHas {
  (prop: string | number | symbol, data: object): boolean;
  (prop: string | number | symbol): (data: object) => boolean;
}

interface IMap {
  <T, R>(cb: (item: T) => R, list: T[]): R[];

  <T, R>(cb: (item: T) => R): (list: T[]) => R[];
}

interface IPipe {
  <A, B>(cb1: (a: A) => B): (a: A) => B;

  <A, B, R>(cb1: (a: A) => B, cb2: (b: B) => R): (a: A) => R;

  <A, B, C, R>(cb1: (a: A) => B, cb2: (b: B) => C, cb3: (c: C) => R): (a: A) => R;

  <A, B, C, D, R>(
    cb1: (a: A) => B,
    cb2: (b: B) => C,
    cb3: (c: C) => D,
    cb4: (c: D) => R,
  ): (a: A) => R;

  <A, B, C, D, E, R>(
    cb1: (a: A) => B,
    cb2: (b: B) => C,
    cb3: (c: C) => D,
    cb4: (c: D) => E,
    cb5: (data: E) => R,
  ): (a: A) => R;
}

interface IProp {
  <T, K extends keyof T>(key: K, data: T): T[K];

  <T, K extends keyof T>(key: K): (data: T) => T[K];
}

interface ICurry {
  <A, B, R>(cb: (a: A, b: B) => R): (a: A, b: B) => R;

  <A, B, R>(cb: (a: A, b: B) => R): (a: A) => (b: B) => R;

  <A, B, C, R>(cb: (a: A, b: B, c: C) => R): (a: A, b: B, c: C) => R;

  <A, B, C, R>(cb: (a: A, b: B, c: C) => R): (a: A, b: B) => (c: C) => R;

  <A, B, C, R>(cb: (a: A, b: B, c: C) => R): (a: A) => (b: B) => (c: C) => R;
}
