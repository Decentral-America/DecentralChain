import { Candle } from '@decentralchain/data-entities';
import {
  ILibOptions,
  ILibRequest,
  TCreateGetFn,
  TCandlesParams,
  TCandlesRequestFilters,
  TGetCandles,
} from '../types';

import { createMethod } from './createMethod';
import { createRequest } from '../createRequest';

type TCandlesParamsKey = keyof TCandlesParams;

const possibleParams: Array<TCandlesParamsKey> = [
  'timeStart',
  'timeEnd',
  'interval',
  'matcher',
];

const isCandlesParams = (params: any): params is TCandlesParams =>
  params !== null &&
  typeof params === 'object' &&
  !Array.isArray(params) &&
  Object.keys(params).every((k: TCandlesParamsKey) =>
    possibleParams.includes(k)
  );

const isFilters = (filters: any): filters is TCandlesRequestFilters =>
  Array.isArray(filters) &&
  filters.length === 3 &&
  typeof filters[0] === 'string' &&
  typeof filters[1] === 'string' &&
  isCandlesParams(filters[2]);

const validateFilters = (filters: any) =>
  isFilters(filters)
    ? Promise.resolve(filters)
    : Promise.reject(new Error('ArgumentsError: invalid candles filters'));

const createRequestForCandles = (rootUrl: string) => ([
  amountAssetId,
  priceAssetId,
  params,
]: TCandlesRequestFilters): ILibRequest =>
  createRequest(`${rootUrl}/candles/${encodeURIComponent(amountAssetId)}/${encodeURIComponent(priceAssetId)}`, params);

const createGetCandles: TCreateGetFn<TGetCandles> = (libOptions: ILibOptions) =>
  createMethod<Candle[]>({
    validate: validateFilters,
    generateRequest: createRequestForCandles,
    libOptions,
  });

export default createGetCandles;
