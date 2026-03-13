import { type Asset } from '@decentralchain/data-entities';

import { createRequest } from '../createRequest';
import {
  type ILibOptions,
  type ILibRequest,
  type TCreateGetFn,
  type TGetAssetsByTicker,
} from '../types';

import { createMethod } from './createMethod';

const validateTicker = (ticker: string): Promise<string> => {
  if (typeof ticker !== 'string') {
    return Promise.reject(new Error('ArgumentsError: Ticker should be string'));
  }
  if (ticker.trim().length === 0) {
    return Promise.reject(new Error('ArgumentsError: Ticker must not be empty string'));
  }
  return Promise.resolve(ticker);
};

const createRequestForMany =
  (rootUrl: string) =>
  (ticker: string): ILibRequest =>
    createRequest(`${rootUrl}/assets`, { ticker });

const createGetAssetsByTicker: TCreateGetFn<TGetAssetsByTicker> = (libOptions: ILibOptions) =>
  createMethod<Asset[]>({
    generateRequest: createRequestForMany,
    libOptions,
    validate: validateTicker,
  });

export default createGetAssetsByTicker;
