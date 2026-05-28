import { Asset as AssetInfo, type BigNumber } from '@decentralchain/data-entities';
import { type Effect, type Option } from 'effect';
import { type AppError } from '../errorHandling';
import { CandleInterval, type Interval, interval, Unit } from './interval';
import { type List, list } from './list';
import { type Serializable, toSerializable } from './serializable';

export type { CacheSync } from './cache';
export type { Without, XOR } from './generic';
export type { FromSerializable, Serializable } from './serializable';
export { CandleInterval, type Interval, interval, type List, list, Unit };

export const fromMaybe =
  <A, B>(factory: (a?: A) => B) =>
  (mb: Option.Option<A>): B =>
    mb._tag === 'Some' ? factory(mb.value) : factory();

export type Items<Item> = {
  items: Item[];
};

export type SearchedItems<Item> = Items<Item> & {
  lastCursor?: string;
  isLastPage: boolean;
};

export type ServiceGetRequest<Id = string> = { id: Id };
export type ServiceMgetRequest<Ids = string[]> = { ids: Ids };

export type Service<Request, Response> = (request: Request) => Effect.Effect<Response, AppError>;

export type RepoGetResponse<Response> = Option.Option<Response>;
export type RepoGet<Request, Response> = {
  readonly get: (request: Request) => Effect.Effect<RepoGetResponse<Response>, AppError>;
};

export type RepoMgetResponse<Response> = Option.Option<Response>[];
export type RepoMget<Request, Response> = {
  readonly mget: (request: Request) => Effect.Effect<RepoMgetResponse<Response>, AppError>;
};

export type RepoSearchResponse<Response> = SearchedItems<Response>;
export type RepoSearch<Request, Response> = {
  readonly search: (request: Request) => Effect.Effect<RepoSearchResponse<Response>, AppError>;
};

export type Repo<GetRequest, MgetRequest, SearchRequest, Response> = RepoGet<GetRequest, Response> &
  RepoMget<MgetRequest, Response> &
  RepoSearch<SearchRequest, Response>;

export type RepoResponse<Response> =
  | Option.Option<Response>
  | Option.Option<Response>[]
  | RepoSearchResponse<Response>;

export { AssetInfo };
export type Asset = Serializable<'asset', AssetInfo | null>;
export const asset = (data: AssetInfo | null = null): Asset => toSerializable('asset', data);

export type AliasInfo = {
  alias: string;
  address: string | null;
};
export type Alias = Serializable<'alias', AliasInfo | null>;
export const alias = (data: AliasInfo | null): Alias => toSerializable('alias', data);

export type CandleInfo = {
  time: Date;
  timeClose: Date;
  maxHeight: number;
  open: BigNumber | null;
  high: BigNumber;
  low: BigNumber;
  close: BigNumber | null;
  volume: BigNumber;
  quoteVolume: BigNumber;
  weightedAveragePrice: BigNumber;
  txsCount: number;
};
export type Candle = Serializable<'candle', CandleInfo | null>;
export const candle = (data: CandleInfo | null = null): Candle => toSerializable('candle', data);

// CandleInterval is exported from ./interval

export type PairInfo = {
  firstPrice: BigNumber;
  lastPrice: BigNumber;
  low: BigNumber;
  high: BigNumber;
  weightedAveragePrice: BigNumber;
  volume: BigNumber;
  quoteVolume: BigNumber;
  volumeWaves: BigNumber | null;
  txsCount: number;
};

export type Pair = Serializable<'pair', PairInfo | null> & Partial<AssetIdsPair>;
export const pair = (data: PairInfo | null, pairData: AssetIdsPair | null): Pair => ({
  ...toSerializable('pair', data),
  ...pairData,
});

export const DataEntryType = {
  Binary: 'binary',
  Boolean: 'boolean',
  Integer: 'integer',
  String: 'string',
} as const;
export type DataEntryType = (typeof DataEntryType)[keyof typeof DataEntryType];
export type TransactionInfo = {
  id: string;
  timestamp: Date;
  type: number;
};
export type CommonTransactionInfo = TransactionInfo & {
  txUid: BigNumber;
};
export type NotNullTransaction = Serializable<'transaction', TransactionInfo>;
export type Transaction = Serializable<'transaction', TransactionInfo | null>;
export const transaction = (data: TransactionInfo | null = null): Transaction =>
  toSerializable('transaction', data);

export type AssetIdsPair = {
  amountAsset: string;
  priceAsset: string;
};

export type RateMgetParams = {
  pairs: AssetIdsPair[];
  matcher: string;
  timestamp: Option.Option<Date>;
};

export type RateGetParams = {
  pair: AssetIdsPair;
  matcher: string;
  timestamp: Option.Option<Date>;
};

export type RateInfo = {
  rate: BigNumber;
};
export type RateWithPairIds = RateInfo & AssetIdsPair;

export type Rate = Serializable<'rate', RateInfo | null> & AssetIdsPair;
export const rate = (data: RateInfo | null, assetMeta: AssetIdsPair): Rate => ({
  ...toSerializable('rate', data ?? null),
  ...assetMeta,
});
