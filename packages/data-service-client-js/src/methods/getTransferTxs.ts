import { createRequest } from '../createRequest';
import {
  type IGetTransferTxs,
  type ILibRequest,
  type ITransaction,
  type ITransferTxFilters,
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
    createRequest(`${rootUrl}/transactions/transfer/${encodeURIComponent(id)}`);

//Many
const isFilters = (filters: unknown): filters is ITransferTxFilters => {
  const possibleFilters = [
    'sender',
    'assetId',
    'recipient',
    'after',
    'timeStart',
    'timeEnd',
    'sort',
    'limit',
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
  (filters: ITransferTxFilters): ILibRequest =>
    createRequest(`${rootUrl}/transactions/transfer`, filters);

const createGetTransferTxs: TCreateGetFn<IGetTransferTxs> = (libOptions) => {
  const getTransferTxsOne = createMethod<ITransaction[]>({
    validate: validateId,
    generateRequest: generateRequestOne,
    libOptions,
  });
  const getTransferTxsMany = createMethod<ITransaction[]>({
    validate: validateFilters,
    generateRequest: generateRequestMany,
    libOptions,
    addPaginationToArgs: ({ args: [filters], cursor, count }) => ({
      ...filters,
      after: cursor,
      ...(count ? { limit: count } : {}),
    }),
  });

  const getTransferTxs: IGetTransferTxs = (idOrFilters?: string | ITransferTxFilters) =>
    typeof idOrFilters === 'string'
      ? getTransferTxsOne(idOrFilters)
      : getTransferTxsMany(idOrFilters === undefined ? {} : idOrFilters);

  return getTransferTxs;
};

export default createGetTransferTxs;
