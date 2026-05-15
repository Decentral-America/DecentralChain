export function keys<T extends Record<string, unknown>>(o: T): (keyof T & string)[] {
  return Object.keys(o);
}

/** Generate a cryptographically unique string ID with the given prefix. */
export function uniqueId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

/** Wrap a value in an array if it is not already one. */
export function toArray<T>(some: T | T[]): T[] {
  return Array.isArray(some) ? some : [some];
}

/** Left-to-right function composition. */
export function pipe<T, R>(a: (data: T) => R): (data: T) => R;
export function pipe<T, U, R>(a: (data: T) => U, b: (data: U) => R): (data: T) => R;
export function pipe<T, U, E, R>(
  a: (data: T) => U,
  b: (data: U) => E,
  c: (data: E) => R,
): (data: T) => R;
export function pipe(...args: ((a: unknown) => unknown)[]): (data: unknown) => unknown {
  return (data) => args.reduce((acc, cb) => cb(acc), data);
}
