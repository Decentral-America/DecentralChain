import { createRequest } from '../createRequest';
import {
  type ILibOptions,
  type ILibRequest,
  type TAlias,
  type TAliases,
  type TAliasesByAddressParams,
  type TAliasId,
  type TCreateGetFn,
} from '../types';
import { isNotString } from '../utils';

import { createMethod } from './createMethod';

const validateId = (id: string): Promise<string> =>
  isNotString(id)
    ? Promise.reject(new Error('ArgumentsError: aliasId should be string'))
    : Promise.resolve(id);

const validateIdList = (idList: string[]): Promise<string[]> =>
  !Array.isArray(idList)
    ? Promise.reject(new Error('ArgumentsError: aliasId should be Array'))
    : idList.length === 0
      ? Promise.reject(new Error('ArgumentsError: alias list must not be empty'))
      : idList.some((id) => typeof id !== 'string')
        ? Promise.reject(new Error('ArgumentsError: each alias in list should be string'))
        : idList.some((id) => id.trim().length === 0)
          ? Promise.reject(new Error('ArgumentsError: alias id must not be empty string'))
          : Promise.resolve(idList);

const validateByAddressParams = ([
  address,
  options,
]: TAliasesByAddressParams): Promise<TAliasesByAddressParams> =>
  isNotString(address)
    ? Promise.reject(new Error('ArgumentsError: address should be string'))
    : Promise.resolve([address, options] as TAliasesByAddressParams);

const createRequestForId =
  (rootUrl: string) =>
  (id: TAliasId): ILibRequest =>
    createRequest(`${rootUrl}/aliases/${encodeURIComponent(id)}`);

const createRequestForIdList =
  (rootUrl: string) =>
  (idList: TAliasId[]): ILibRequest =>
    createRequest(`${rootUrl}/aliases`, { aliases: idList });

const createRequestForAddress =
  (rootUrl: string) =>
  ([address, options]: TAliasesByAddressParams): ILibRequest => {
    const safeOptions = options ?? {};
    return createRequest(`${rootUrl}/aliases`, {
      address,
      showBroken: safeOptions.showBroken,
    });
  };

const createGetAliases: TCreateGetFn<TAliases> = (libOptions: ILibOptions) => ({
  getById: createMethod<TAlias[]>({
    validate: validateId,
    generateRequest: createRequestForId,
    libOptions,
  }),
  getByIdList: createMethod<TAlias[]>({
    validate: validateIdList,
    generateRequest: createRequestForIdList,
    libOptions,
  }),
  getByAddress: (address, options?) =>
    createMethod<TAlias[]>({
      validate: validateByAddressParams,
      generateRequest: createRequestForAddress,
      libOptions,
    })(address, options ?? {}),
});

export default createGetAliases;
