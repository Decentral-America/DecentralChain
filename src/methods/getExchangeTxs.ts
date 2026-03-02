import { createRequest } from '../createRequest';
import type {
  ILibRequest,
  TCreateGetFn,
  ITransaction,
  IExchangeTxFilters,
  IGetExchangeTxs,
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
const isFilters = (filters: any): filters is IExchangeTxFilters => {
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
    isValidLimit(filters.limit) &&
    isValidSort(filters.sort)
  );
};
const validateFilters = (filters: any) =>
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
      : // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- null must be rejected by validators
        getExchangeTxsMany(idOrFilters === undefined ? {} : idOrFilters);

  return getExchangeTxs;
};

export default createGetExchangeTxs;
