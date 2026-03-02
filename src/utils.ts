import { TFunction } from './types';

const DEFAULT_TIMEOUT_MS = 30000;

export const defaultFetch = (url: string, options?: RequestInit): Promise<string> => {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const fetchOptions: RequestInit = {
    ...options,
    ...(controller ? { signal: controller.signal } : {}),
  };
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS)
    : null;

  return (window as any)
    .fetch(url, fetchOptions)
    .then((res: Response) => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      return res.ok
        ? res.text()
        : res.text().then(str =>
            Promise.reject(
              new Error(
                `HTTP ${res.status} ${res.statusText}: ${str.slice(0, 500)}`
              )
            )
          );
    })
    .catch((err: Error) => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        return Promise.reject(
          new Error(`Request to ${url} timed out after ${DEFAULT_TIMEOUT_MS}ms`)
        );
      }
      return Promise.reject(
        new Error(`Network error fetching ${url}: ${err.message}`)
      );
    });
};

export const defaultParse = (text: string): any => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    throw new Error('Parse error: received empty or non-string response');
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Parse error: invalid JSON response (${(e as Error).message}). First 100 chars: ${text.slice(0, 100)}`
    );
  }
};
export const isNotString = (value: any): boolean => typeof value !== 'string';
export const pipeP = (...fns: TFunction<any>[]) => (
  ...args: any[]
): Promise<any> =>
  fns.reduce(
    (prev, fn) => prev.then(fn),
    Promise.resolve(args.length === 1 ? args[0] : args)
  );

/**
 * @param obj flat object with primitives or arrays of primitives as values
 * @returns query string for obj
 */
/**
 * customSerialize :: a -> string
 */
const customSerialize = v => {
  switch (true) {
    case v instanceof Date:
      return v.toISOString();
    default:
      return v;
  }
};
const createKeyValue = (key: string, v: unknown): string =>
  `${encodeURIComponent(key)}=${encodeURIComponent(String(customSerialize(v)))}`;
export const createQS = (obj: Object): string => {
  const qs = Object.entries(obj)
    .filter(
      ([_, value]) =>
        value !== undefined &&
        value !== null &&
        !(Array.isArray(value) && value.length === 0)
    )
    .map(([key, valueOrValues]) => {
      return Array.isArray(valueOrValues)
        ? valueOrValues.map(v => createKeyValue(key, v)).join('&')
        : createKeyValue(key, valueOrValues);
    })
    .filter(part => part.length > 0)
    .join('&');
  return qs === '' ? qs : `?${qs}`;
};

export const id = <T>(_: T): T => _;
export const T = (..._args: any[]): true => true;

const DANGEROUS_KEYS = ['__proto__', 'constructor', 'prototype'];
export const hasDangerousKeys = (obj: object): boolean =>
  Object.keys(obj).some(k => DANGEROUS_KEYS.includes(k));

export const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const isValidLimit = (limit: unknown): boolean => {
  if (limit === undefined || limit === null) return true;
  return (
    typeof limit === 'number' &&
    Number.isFinite(limit) &&
    Number.isInteger(limit) &&
    limit > 0 &&
    limit <= 10000
  );
};

export const isValidSort = (sort: unknown): boolean => {
  if (sort === undefined || sort === null) return true;
  return sort === 'asc' || sort === 'desc';
};
