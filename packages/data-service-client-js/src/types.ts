import { type BigNumber } from '@decentralchain/bignumber';
import { type Asset, type AssetPair, type Candle } from '@decentralchain/data-entities';

export enum ApiTypes {
  List = 'list',
  Asset = 'asset',
  Pair = 'pair',
  Transaction = 'transaction',
  Alias = 'alias',
  Candle = 'candle',
}
export enum HttpMethods {
  Get = 'GET',
  Post = 'POST',
}
export interface ILibRequest {
  url: string;
  method: HttpMethods;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
}
export interface ILibOptions {
  rootUrl: string;
  parse?: TParser;
  fetch?: TFunction<unknown>;
  transform?: TFunction<unknown>;
}

export type TResponse<T> = Promise<{
  data: T;
  fetchMore?: TFunction<TResponse<T>>;
}>;
export type TCreateGetFn<T> = (libOptions: ILibOptions) => T;
// biome-ignore lint/suspicious/noExplicitAny: Generic function type requires any[] for contravariant parameter position
export type TFunction<T> = (...args: any[]) => T;
export type TParser = (text: string) => unknown;

export type ITransaction = object;
export interface IExchangeTxFilters {
  timeStart?: string | Date | number;
  timeEnd?: string | Date | number;
  matcher?: string;
  sender?: string;
  amountAsset?: string | Asset;
  priceAsset?: string | Asset;
  limit?: number;
  sort?: string;
}
export interface ITransferTxFilters {
  sender?: string;
  recipient?: string;
  assetId?: string;
  timeStart?: string | Date | number;
  timeEnd?: string | Date | number;
  limit?: number;
  sort?: string;
}

export interface IMassTransferTxFilters {
  sender?: string;
  recipient?: string;
  assetId?: string;
  timeStart?: string | Date | number;
  timeEnd?: string | Date | number;
  limit?: number;
  sort?: string;
}

export interface IGetExchangeTxs {
  (filters: IExchangeTxFilters): TResponse<ITransaction[]>;
  (id: string): TResponse<ITransaction>;
  (filtersOrId?: IExchangeTxFilters | string): TResponse<ITransaction[] | ITransaction>;
}
export interface IGetTransferTxs {
  (filters: ITransferTxFilters): TResponse<ITransaction[]>;
  (id: string): TResponse<ITransaction>;
  (filtersOrId?: ITransferTxFilters | string): TResponse<ITransaction[] | ITransaction>;
}
export interface IGetMassTransferTxs {
  (filters: IMassTransferTxFilters): TResponse<ITransaction[]>;
  (id: string): TResponse<ITransaction>;
  (filtersOrId?: IMassTransferTxFilters | string): TResponse<ITransaction[] | ITransaction>;
}

export type TAssetId = string;
export type TGetAssets = (...ids: TAssetId[]) => TResponse<Asset[]>;
export type TGetAssetsByTicker = (ticker: string) => TResponse<Asset[]>;

export type TAliasId = string;
export interface TAlias {
  address: string;
  alias: string;
}
export interface TAliasesByAddressOptions {
  showBroken?: boolean;
}
export type TAliasesByAddressParams = [string, TAliasesByAddressOptions];
export interface TAliases {
  getById: TGetAliasById;
  getByIdList: TGetAliasByIdList;
  getByAddress: TGetAliasesByAddress;
}
export type TGetAliasById = (id: TAliasId) => TResponse<TAlias[]>;
export type TGetAliasByIdList = (idList: TAliasId[]) => TResponse<TAlias[]>;
export type TGetAliasesByAddress = (
  address: string,
  options?: TAliasesByAddressOptions,
) => TResponse<TAlias[]>;

export interface TCandlesParams {
  timeStart: string | Date | number;
  timeEnd?: string | Date | number;
  interval: string;
  matcher: string;
}
export type TCandlesRequestFilters = [string, string, TCandlesParams];
export type TGetCandles = (
  amountAsset: string,
  priceAsset: string,
  params: TCandlesParams,
) => TResponse<Candle[]>;

export type TPairsRequest = [string, AssetPair[]];
export interface TPairJSON {
  firstPrice: BigNumber;
  lastPrice: BigNumber;
  volume: BigNumber;
  amountAsset: string;
  priceAsset: string;
}
export type TGetPairs = (matcher: string) => (pairs: AssetPair[]) => TResponse<TPairJSON[]>;
