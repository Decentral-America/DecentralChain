import { type Asset, type Money } from '@decentralchain/data-entities';
import { type txApi as txApi } from '../transactions/interface';

export namespace assetsApi {
  export interface IBalanceList {
    address: string;
    balances: Array<IBalanceItem>;
  }

  export interface IBalanceItem {
    assetId: string;
    balance: string;
    issueTransaction: txApi.IIssue;
    quantity: string;
    reissuable: boolean;
    sponsorBalance: string | number | void;
    minSponsoredAssetFee: string | number | void;
  }

  export interface IDCCBalance {
    address: string;
    available: string;
    effective: string;
    generating: string;
    regular: string;
  }
}

export interface IBalanceItem {
  asset: Asset;
  regular: Money;
  available: Money;
  inOrders: Money;
  leasedOut: Money;
  leasedIn: Money;
}
