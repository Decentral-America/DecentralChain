import { createRequest } from '../createRequest';
import {
  type IExchangeTxFilters,
  type IGetExchangeTxs,
  type ILibRequest,
  type ITransaction,
  type TCreateGetFn,
} from '../types';
import { hasDangerousKeys, isValidLimit, isValidSort } from '../utils';

import { createMethod } from './createMethod';

// One
const validateId = (id: unknown) =>
  typeof id === 'string'
    ? Promise.resolve(id)
    : Promise.reject(new Error('ArgumentsError: id should be string'));
const generateRequestOne =
  (rootUrl: string) =>
  (id: string): ILibRequest =>
    createRequest(`${rootUrl}/transactions/exchange/${encodeURIComponent(id)}`);

//Many
const isFilters = (filters: unknown): filters is IExchangeTxFilters => {
  const possibleFilters = [
    'timeStart',
    'timeEnd',
    'limit',
    'sort',
    'matcher',
    'sender',
    'amountAsset',
    'priceAsset',
    'after',
  ];
  return (
    filters !== null &&
    typeof filters === 'object' &&
    !Array.isArray(filters) &&
    !hasDangerousKeys(filters) &&
    Object.keys(filters).every((k) => possibleFilters.includes(k)) &&
    isValidLimit((filters as { limit?: unknown }).limit) &&
    isValidSort((filters as { sort?: unknown }).sort)
  );
};
const validateFilters = (filters: unknown) =>
  isFilters(filters)
    ? Promise.resolve(filters)
    : Promise.reject(new Error('ArgumentsError: invalid filters object'));

const generateRequestMany =
  (rootUrl: string) =>
  (filters: IExchangeTxFilters): ILibRequest =>
    createRequest(`${rootUrl}/transactions/exchange`, filters);

const createGetExchangeTxs: TCreateGetFn<IGetExchangeTxs> = (libOptions) => {
  const getExchangeTxsOne = createMethod<ITransaction[]>({
    validate: validateId,
    generateRequest: generateRequestOne,
    libOptions,
  });
  const getExchangeTxsMany = createMethod<ITransaction[]>({
    validate: validateFilters,
    generateRequest: generateRequestMany,
    libOptions,
    addPaginationToArgs: ({ args: [filters], cursor, count }) => ({
      ...filters,
      after: cursor,
      ...(count ? { limit: count } : {}),
    }),
  });

  const getExchangeTxs: IGetExchangeTxs = (idOrFilters?: string | IExchangeTxFilters) =>
    typeof idOrFilters === 'string'
      ? getExchangeTxsOne(idOrFilters)
      : getExchangeTxsMany(idOrFilters === undefined ? {} : idOrFilters);

  return getExchangeTxs;
};

export default createGetExchangeTxs;
