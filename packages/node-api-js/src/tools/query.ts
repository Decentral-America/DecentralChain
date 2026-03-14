import { toArray } from './utils';

/**
 * Build a URL query string from a parameter object.
 *
 * All keys and values are percent-encoded via `encodeURIComponent` to prevent
 * query-string injection (e.g. values containing `&`, `=`, or `#`).
 */
export default function <T extends object>(params: T, evolver: TEvolver<T> = {}): string {
  const record = params as Record<string, unknown>;
  const query = Object.keys(params)
    .map<[keyof T, T[keyof T]]>((key) => [key as keyof T, record[key] as T[keyof T]])
    .map(([key, value]) => [
      key,
      Object.hasOwn(evolver, key)
        ? (evolver[key] as (data: T[keyof T]) => string | undefined)(value)
        : value,
    ])
    .filter(([_key, value]) => value != null)
    .map(([key, value]) =>
      toArray(value)
        .map((v) => `${encodeURIComponent(String(key))}=${encodeURIComponent(String(v))}`)
        .join('&'),
    )
    .join('&');
  return query.length ? `?${query}` : '';
}

type TEvolver<T extends object> = {
  [Key in keyof T]?: (value: T[Key]) => string | undefined;
};
