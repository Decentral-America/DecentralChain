import { type Asset, type Money } from '@decentralchain/data-entities';
import { txApi } from '../transactions/interface';

// biome-ignore lint/style/noNamespace: TypeScript declaration file
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
    sponsorBalance: string | number | undefined;
    minSponsoredAssetFee: string | number | undefined;
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
