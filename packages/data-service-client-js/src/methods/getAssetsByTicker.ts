import { Asset } from '@decentralchain/data-entities';
import {
  TCreateGetFn,
  ILibOptions,
  ILibRequest,
  TGetAssetsByTicker,
} from '../types';

import { createMethod } from './createMethod';
import { createRequest } from '../createRequest';

const validateTicker = (ticker: string): Promise<string> => {
  if (typeof ticker !== 'string') {
    return Promise.reject(new Error('ArgumentsError: Ticker should be string'));
  }
  if (ticker.trim().length === 0) {
    return Promise.reject(
      new Error('ArgumentsError: Ticker must not be empty string')
    );
  }
  return Promise.resolve(ticker);
};

const createRequestForMany = (rootUrl: string) => (
  ticker: string
): ILibRequest => createRequest(`${rootUrl}/assets`, { ticker });

const createGetAssetsByTicker: TCreateGetFn<TGetAssetsByTicker> = (
  libOptions: ILibOptions
) =>
  createMethod<Asset[]>({
    validate: validateTicker,
    generateRequest: createRequestForMany,
    libOptions,
  });

export default createGetAssetsByTicker;
