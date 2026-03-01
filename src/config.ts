import { type IAssetInfo } from './entities/Asset';
import { type ICandleInfo } from './entities/Candle';

/** Configuration options for data entity transformations. */
export interface IConfig {
  remapAsset: (asset: IAssetInfo) => IAssetInfo;
  remapCandle: (candle: ICandleInfo) => ICandleInfo;
}

const storage: IConfig = {
  remapAsset: (data) => data,
  remapCandle: (data) => data,
};

/**
 * Global configuration namespace for data entities.
 *
 * Use `config.get(key)` to retrieve a configuration value and
 * `config.set(key, value)` or `config.set(values)` to update configuration.
 */
export namespace config {
  /** Retrieve a configuration value by key. */
  export function get<K extends keyof IConfig>(key: K): IConfig[K] {
    return storage[key];
  }

  /** Set a single configuration value by key. */
  export function set<K extends keyof IConfig>(key: K, value: IConfig[K]): void;
  /** Set multiple configuration values at once. */
  export function set(values: Partial<IConfig>): void;
  export function set(
    keyOrValues: string | Partial<IConfig>,
    value?: IConfig[keyof IConfig],
  ): void {
    if (typeof keyOrValues === 'string') {
      if (value !== undefined) {
        Object.assign(storage, { [keyOrValues]: value });
      }
    } else {
      Object.assign(storage, keyOrValues);
    }
  }
}
