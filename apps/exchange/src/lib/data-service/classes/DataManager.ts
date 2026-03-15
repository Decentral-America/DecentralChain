import { type Money } from '@decentralchain/data-entities';
import {
  DATA_PROVIDER_VERSIONS,
  STATUS_LIST,
  type TProviderAsset,
} from '@decentralchain/oracle-data';
import { path } from 'ramda';
import { getAliasesByAddress } from '../api/aliases/aliases';
import { balanceList } from '../api/assets/assets';
import { type IBalanceItem } from '../api/assets/interface';
import { getOracleData, type IOracleData } from '../api/data';
import { getReservedBalance } from '../api/matcher/getOrders';
import { change, get } from '../config';
import { type IHash } from '../interface';
import { type IPollAPI, Poll } from '../utils/Poll';
import { PollControl } from './PollControl';
import { UTXManager } from './UTXManager';

interface DCCAppGlobal {
  defaultAssets: { BTC: string };
}

interface AngularGlobal {
  element: (el: Element) => {
    injector: () => {
      get: (name: string) => { get: (path: string) => unknown };
    };
  };
}

export class DataManager {
  public transactions: UTXManager = new UTXManager();
  public pollControl: PollControl<TPollHash>;
  private _address: string;
  private _silentMode: boolean = false;

  constructor() {
    this.pollControl = new PollControl<TPollHash>(() => this._createPolls());
    change.on((key) => {
      if (key === 'oracleDCC' && !this._silentMode) {
        this.pollControl.restart('oracleDCC');
      }
    });
  }

  public setSilentMode(silent: boolean): void {
    this._silentMode = silent;
    if (silent) {
      this.pollControl.pause();
    } else {
      this.pollControl.play();
    }
  }

  public applyAddress(address: string): void {
    this.dropAddress();
    this._address = address;
    this.pollControl.create();
    this.transactions.applyAddress(this._address);
  }

  public dropAddress() {
    this._address = undefined;
    this.pollControl.destroy();
    this.transactions.dropAddress();
  }

  public getBalances(): Promise<Array<IBalanceItem>> {
    return this.pollControl.getPollHash().balance.getDataPromise();
  }

  public getReservedInOrders(): Promise<IHash<Money>> {
    return this.pollControl.getPollHash().orders.getDataPromise();
  }

  public getAliasesPromise(): Promise<Array<string>> {
    return this.pollControl.getPollHash().aliases.getDataPromise();
  }

  public getLastAliases(): Array<string> {
    return this.pollControl.getPollHash().aliases.lastData || [];
  }

  public getOracleAssetDataByOracleName(
    id: string,
    oracleName: string = 'oracleDCC',
  ): TProviderAsset & { provider: string } {
    const pollHash = this.pollControl.getPollHash();
    const lastData = path<IOracleData>([oracleName, 'lastData'], pollHash);
    const assets = lastData?.assets || Object.create(null);
    const DCCApp = (window as unknown as { DCCApp: DCCAppGlobal }).DCCApp;

    const gateways = {
      [DCCApp.defaultAssets.BTC]: true,
    };

    const gatewaysSoon =
      (window as unknown as { angular: AngularGlobal }).angular
        .element(document.body)
        .injector()
        .get('configService')
        .get('GATEWAYS_SOON') || [];

    const descriptionHash = {
      DCC: {
        en: 'DecentralCoin (DCC) es la moneda nativa del protocolo DecentralChain. DecentralChain permite facilitar la creación de activos, coleccionables digitales, redes de blockchain privadas y aplicaciones descentralizadas, para facilitar la adopción de tecnologías descentralizadas en empresas y comunidades',
      },
    };

    const gatewayAsset = {
      description: descriptionHash[id],
      email: null,
      id,
      link: null,
      logo: null,
      provider: 'DCCPlatform',
      status: 3,
      ticker: null,
      version: DATA_PROVIDER_VERSIONS.BETA,
    };

    const gatewaySoonAsset = {
      ...gatewayAsset,
      status: 4,
    };

    if (id === 'DCC') {
      return {
        description: descriptionHash.DCC,
        status: STATUS_LIST.VERIFIED,
      } as TProviderAsset & { provider: string };
    }

    if (gatewaysSoon.indexOf(id) > -1) {
      return gatewaySoonAsset;
    }

    if (gateways[id]) {
      return gatewayAsset;
    }

    return assets[id] ? { ...assets[id], provider: lastData.oracle.name } : null;
  }

  public getOraclesAssetData(id: string) {
    const dataOracleDCC = this.getOracleAssetDataByOracleName(id, 'oracleDCC');
    const dataOracleTokenomica = this.getOracleAssetDataByOracleName(id, 'oracleTokenomica');
    return dataOracleDCC || dataOracleTokenomica;
  }

  public getOracleData(oracleName: string) {
    return this.pollControl.getPollHash()[oracleName].lastData;
  }

  private _getPollBalanceApi(): IPollAPI<Array<IBalanceItem>> {
    const get = () => {
      const hash = this.pollControl.getPollHash();
      const inOrdersHash = hash?.orders.lastData || Object.create(null);
      return balanceList(this._address, Object.create(null), inOrdersHash);
    };
    return { get, set: () => null };
  }

  private _getPollOrdersApi(): IPollAPI<IHash<Money>> {
    return {
      get: () => getReservedBalance(),
      set: () => null,
    };
  }

  private _getPollAliasesApi(): IPollAPI<Array<string>> {
    return {
      get: () => getAliasesByAddress(this._address),
      set: () => null,
    };
  }

  private _getPollOracleApi(address: string): IPollAPI<IOracleData> {
    return {
      get: () => {
        return address
          ? getOracleData(address)
          : (Promise.resolve({ assets: Object.create(null) }) as Promise<IOracleData>);
      },
      set: () => null,
    };
  }

  private _createPolls(): TPollHash {
    const balance = new Poll(this._getPollBalanceApi(), 1000);
    const orders = new Poll(this._getPollOrdersApi(), 1000);
    const aliases = new Poll(this._getPollAliasesApi(), 10000);
    const oracleDCC = new Poll(this._getPollOracleApi(get('oracleDCC')), 30000);
    const oracleTokenomica = new Poll(this._getPollOracleApi(get('oracleTokenomica')), 30000);

    return { aliases, balance, oracleDCC, oracleTokenomica, orders };
  }
}

type TPollHash = {
  balance: Poll<Array<IBalanceItem>>;
  orders: Poll<IHash<Money>>;
  aliases: Poll<Array<string>>;
  oracleDCC: Poll<IOracleData>;
  oracleTokenomica: Poll<IOracleData>;
};

export interface IOracleAsset {
  id: string;
  status: number; // TODO! Add enum
  logo: string;
  site: string;
  ticker: string;
  email: string;
  description?: Record<string, string>;
}
