import { type Asset, type AssetPair, type Money } from '@decentralchain/data-entities';
import { type BigNumber } from '@decentralchain/bignumber';

export interface IHash<T> {
  [key: string]: T;
}

export interface IAssetPair {
  amountAsset: string;
  priceAsset: string;
}

export interface IKeyPair {
  publicKey: string;
  privateKey: string;
}

export type TOrderType = 'buy' | 'sell';
export type TLeasingStatus = 'active' | 'canceled';

export type TBigNumberData = string | number | BigNumber;
export type TAssetData = Asset | string;

export type IMoneyFactory = (data: string | number | BigNumber, asset: Asset) => Money;

export type IPriceMoneyFactory = (data: string | number | BigNumber, pair: AssetPair) => Money;

export interface ITokenRating {
  assetId: string;
  assetName: string;
  averageScore: number;
  createdAt: string;
  details: object;
  lastAverageScore: number;
  scoreBoard: object;
  sender: string;
  sumTokens: number;
  timestamp: number;
  top: boolean;
  txId: string;
  voted: boolean;
  votes: array;
  votesCount: number;
}

export interface IParsedRating {
  assetId: string;
  rating: number;
}
