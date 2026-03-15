import { type IAssetPair } from '../../interface';
import { type Money, type AssetPair } from '@decentralchain/data-entities';

export type TOrderStatus = 'Accepted' | 'Cancelled' | 'PartiallyFilled' | 'Filled';
export type TOrderType = 'buy' | 'sell';

// biome-ignore lint/style/noNamespace: TypeScript declaration file
export namespace api {
  export interface IOrder {
    amount: string;
    price: string;
    filled: string;
    assetPair: IAssetPair;
    id: string;
    status: TOrderStatus;
    timestamp: number;
    type: TOrderType;
  }
}

export interface IOrder {
  amount: Money;
  price: Money;
  filled: Money;
  total: Money;
  assetPair: AssetPair;
  id: string;
  progress: number;
  status: TOrderStatus;
  timestamp: Date;
  isActive: boolean;
  type: TOrderType;
}
