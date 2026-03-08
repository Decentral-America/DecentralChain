import { AssetPair } from '@decentralchain/data-entities';

import { createRequest } from '../createRequest';
import {
  type ILibOptions,
  type ILibRequest,
  type TCreateGetFn,
  type TGetPairs,
  type TPairJSON,
  type TPairsRequest,
} from '../types';

import { createMethod } from './createMethod';

const isAssetPair = (pair: unknown) => {
  switch (true) {
    case typeof pair === 'string':
      return pair.split('/').length === 2;
    case typeof pair === 'object' && pair !== null:
      return AssetPair.isAssetPair(pair);
    default:
      return false;
  }
};

const isValidPairsFilters = (request: unknown): request is TPairsRequest => {
  return (
    Array.isArray(request) &&
    request.length === 2 &&
    typeof request[0] === 'string' &&
    (Array.isArray(request[1]) ? request[1] : [request[1]]).every(isAssetPair)
  );
};

const validateRequest =
  (matcher: unknown) =>
  (pairs: unknown): Promise<TPairsRequest> => {
    if (typeof matcher !== 'string' || matcher.trim().length === 0) {
      return Promise.reject(new Error('ArgumentsError: matcher must be a non-empty string'));
    }
    const request = [matcher, pairs];
    return isValidPairsFilters(request)
      ? Promise.resolve(request)
      : Promise.reject(
          new Error('ArgumentsError: AssetPair should be object with amountAsset, priceAsset'),
        );
  };

const createRequestForMany =
  (nodeUrl: string) =>
  ([matcher, pairs]: TPairsRequest): ILibRequest =>
    createRequest(`${nodeUrl}/pairs`, {
      pairs: pairs.map((p) => p.toString()),
      matcher,
    });

const getPairs: TCreateGetFn<TGetPairs> = (libOptions: ILibOptions) => (matcher: string) =>
  createMethod<TPairJSON[]>({
    validate: validateRequest(matcher),
    generateRequest: createRequestForMany,
    libOptions,
  });

export default getPairs;
