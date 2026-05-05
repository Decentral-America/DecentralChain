import { type Option } from 'effect';

export type CacheSync<K, V> = {
  has(key: K): boolean;
  get(key: K): Option.Option<V>;
  set(key: K, value: V): void;
};
