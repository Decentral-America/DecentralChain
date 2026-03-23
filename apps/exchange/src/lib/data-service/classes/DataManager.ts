import { type Money } from '@decentralchain/data-entities';
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
