import type { Candle } from '@decentralchain/data-entities';

import { createRequest } from '../createRequest';
import type {
  ILibOptions,
  ILibRequest,
  TCreateGetFn,
  TCandlesParams,
  TCandlesRequestFilters,
  TGetCandles,
} from '../types';
import { hasDangerousKeys } from '../utils';

import { createMethod } from './createMethod';

type TCandlesParamsKey = keyof TCandlesParams;

const possibleParams: TCandlesParamsKey[] = ['timeStart', 'timeEnd', 'interval', 'matcher'];

const requiredParams: TCandlesParamsKey[] = ['timeStart', 'interval', 'matcher'];

const isCandlesParams = (params: any): params is TCandlesParams =>
  params !== null &&
  typeof params === 'object' &&
  !Array.isArray(params) &&
  !hasDangerousKeys(params) &&
  Object.keys(params).every((k) => possibleParams.includes(k as TCandlesParamsKey)) &&
  requiredParams.every((k) => k in params && params[k] !== undefined);

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

const createRequestForCandles =
  (rootUrl: string) =>
  ([amountAssetId, priceAssetId, params]: TCandlesRequestFilters): ILibRequest => {
    if (
      typeof amountAssetId !== 'string' ||
      amountAssetId.trim().length === 0 ||
      typeof priceAssetId !== 'string' ||
      priceAssetId.trim().length === 0
    ) {
      throw new Error('ArgumentsError: asset IDs must be non-empty strings');
    }
    return createRequest(
      `${rootUrl}/candles/${encodeURIComponent(amountAssetId)}/${encodeURIComponent(priceAssetId)}`,
      params,
    );
  };

const createGetCandles: TCreateGetFn<TGetCandles> = (libOptions: ILibOptions) =>
  createMethod<Candle[]>({
    validate: validateFilters,
    generateRequest: createRequestForCandles,
    libOptions,
  });

export default createGetCandles;
