import { type IAssetInfo } from './entities/asset-types';
import { type ICandleInfo } from './entities/candle-types';

/** Configuration options for data entity transformations. */
export interface IConfig {
  remapAsset: (asset: IAssetInfo) => IAssetInfo;
  remapCandle: (candle: ICandleInfo) => ICandleInfo;
}

const storage: IConfig = {
  remapAsset: (data) => data,
  remapCandle: (data) => data,
};

/** Retrieve a configuration value by key. */
function get<K extends keyof IConfig>(key: K): IConfig[K] {
  return storage[key];
}

/** Set a single configuration value by key. */
function set<K extends keyof IConfig>(key: K, value: IConfig[K]): void;
/** Set multiple configuration values at once. */
function set(values: Partial<IConfig>): void;
function set(keyOrValues: string | Partial<IConfig>, value?: IConfig[keyof IConfig]): void {
  if (typeof keyOrValues === 'string') {
    if (!Object.hasOwn(storage, keyOrValues)) {
      throw new Error(`Unknown config key: "${keyOrValues}"`);
    }
    if (value !== undefined) {
      Object.assign(storage, { [keyOrValues]: value });
    }
  } else {
    const validKeys = Object.keys(storage);
    for (const key of Object.keys(keyOrValues)) {
      if (!validKeys.includes(key)) {
        throw new Error(`Unknown config key: "${key}"`);
      }
    }
    Object.assign(storage, keyOrValues);
  }
}

/**
 * Global configuration for data entities.
 *
 * Use `config.get(key)` to retrieve a configuration value and
 * `config.set(key, value)` or `config.set(values)` to update configuration.
 */
export const config = { get, set } as {
  get: typeof get;
  set: typeof set;
};
