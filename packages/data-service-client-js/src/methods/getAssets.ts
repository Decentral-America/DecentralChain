import { Asset } from '@decentralchain/data-entities';
import {
  ILibOptions,
  ILibRequest,
  TAssetId,
  TGetAssets,
  TCreateGetFn,
} from '../types';

import { isNotString } from '../utils';
import { createMethod } from './createMethod';
import { createRequest } from '../createRequest';

const validateIds = (idOrIds: TAssetId[] | TAssetId): Promise<TAssetId[]> => {
  const arrayToCheck = Array.isArray(idOrIds) ? idOrIds : [idOrIds];
  if (arrayToCheck.length === 0) {
    return Promise.reject(
      new Error('ArgumentsError: at least one AssetId must be provided')
    );
  }
  return arrayToCheck.some(isNotString)
    ? Promise.reject(new Error('ArgumentsError: AssetId should be string'))
    : arrayToCheck.some((id: string) => id.trim().length === 0)
    ? Promise.reject(
        new Error('ArgumentsError: AssetId must not be empty string')
      )
    : Promise.resolve(arrayToCheck);
};

const createRequestForMany = (rootUrl: string) => (
  ids: TAssetId[]
): ILibRequest => createRequest(`${rootUrl}/assets`, { ids });

const createGetAssets: TCreateGetFn<TGetAssets> = (libOptions: ILibOptions) =>
  createMethod<Asset[]>({
    validate: validateIds,
    generateRequest: createRequestForMany,
    libOptions,
  });

export default createGetAssets;
