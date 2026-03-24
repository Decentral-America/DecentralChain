import { BigNumber } from '@decentralchain/bignumber';
import { clone, get, getPaths, Signal } from 'ts-utils';

interface IFeeItem<T> {
  add_smart_asset_fee: boolean;
  add_smart_account_fee: boolean;
  min_price_step: T | BigNumber;
  fee: T | BigNumber;
}

interface IFeeConfig<T> {
  smart_asset_extra_fee: T | BigNumber;
  smart_account_extra_fee: T | BigNumber;
  calculate_fee_rules: Record<number, Partial<IFeeItem<T>> & { default: IFeeItem<T> }>;
}

interface IConfig {
  PERMISSIONS: Record<string, unknown>;
  SETTINGS: Record<string, unknown> & {
    DEX: Record<string, unknown> & { WATCH_LIST_PAIRS: Array<string> };
  } & {};
  SERVICE_TEMPORARILY_UNAVAILABLE: boolean;
}

interface IDCCApp {
  network: {
    featuresConfigUrl: string;
    featuresConfig: IConfig;
    feeConfigUrl: string;
    feeConfig: IFeeConfig<BigNumber>;
  };
  parseJSON: (data: unknown) => unknown;
}

export class ConfigService {
  protected config = Object.create(null) as IConfig;

  protected feeConfig = Object.create(null) as IFeeItem<BigNumber>;

  protected dccApp: IDCCApp;

  protected static _instance: ConfigService | undefined;

  public change = new Signal() as Signal<string>;

  public configReady: Promise<unknown>;

  constructor(dccApp: IDCCApp) {
    if (ConfigService._instance) {
      this.dccApp = ConfigService._instance.dccApp;
      this.config = ConfigService._instance.config;
      this.feeConfig = ConfigService._instance.feeConfig;
      this.change = ConfigService._instance.change;
      this.configReady = ConfigService._instance.configReady;
      return;
    }
    ConfigService._instance = this;
    this.dccApp = dccApp;
    this.configReady = this.fetchConfig();
  }

  public getConfig(path: string) {
    const config = path ? get(this.config, path) : this.config;
    return clone(config);
  }

  public getFeeConfig() {
    return clone(this.feeConfig);
  }

  public fetchConfig(): Promise<unknown> {
    return Promise.all([
      this._getConfig().then((config) => this._setConfig(config)),
      this._getFeeConfig().then((config) => this._setFeeConfig(config)),
    ]);
  }

  protected _getConfig(): Promise<IConfig> {
    return globalThis
      .fetch(this.dccApp.network.featuresConfigUrl)
      .then((r) => r.text())
      .then((data) => JSON.parse(data) as IConfig)
      .catch(() => Promise.resolve(this.dccApp.network.featuresConfig));
  }

  protected _getFeeConfig(): Promise<IFeeConfig<BigNumber>> {
    return globalThis
      .fetch(this.dccApp.network.feeConfigUrl)
      .then((r) => r.text())
      .then((data) => this.dccApp.parseJSON(data))
      .then(ConfigService.parseFeeConfig)
      .catch(() => Promise.resolve(this.dccApp.network.feeConfig));
  }

  protected _setFeeConfig(config: IFeeItem<BigNumber>) {
    this.feeConfig = config;
  }

  protected _setConfig(config: IConfig) {
    const myConfig = this.config;
    this.config = config;

    ConfigService.getDifferencePaths(myConfig, config).forEach((path) => {
      this.change.dispatch(String(path));
    });
  }

  protected static getDifferencePaths(previous: IConfig, next: IConfig) {
    const paths = getPaths(next);
    return paths.filter((path) => get(previous, path) !== get(next, path)).map(String);
  }

  protected static parseFeeConfig(data: unknown): unknown {
    switch (typeof data) {
      case 'number':
      case 'string':
        return new BigNumber(data);
      case 'object': {
        if (data !== null) {
          const record = data as Record<string, unknown>;
          Object.entries(record).forEach(([key, value]) => {
            record[key] = ConfigService.parseFeeConfig(value);
          });
        }
        return data;
      }
      default:
        return data;
    }
  }
}
