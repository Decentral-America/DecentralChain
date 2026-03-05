import { createRequest } from '../createRequest';
import type {
  ILibRequest,
  TCreateGetFn,
  ITransaction,
  IMassTransferTxFilters,
  IGetMassTransferTxs,
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
    createRequest(`${rootUrl}/transactions/mass-transfer/${encodeURIComponent(id)}`);

//Many
const isFilters = (filters: any): filters is IMassTransferTxFilters => {
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
  (filters: IMassTransferTxFilters): ILibRequest =>
    createRequest(`${rootUrl}/transactions/mass-transfer`, filters);

const createGetMassTransferTxs: TCreateGetFn<IGetMassTransferTxs> = (libOptions) => {
  const getMassTransferTxsOne = createMethod<ITransaction[]>({
    validate: validateId,
    generateRequest: generateRequestOne,
    libOptions,
  });
  const getMassTransferTxsMany = createMethod<ITransaction[]>({
    validate: validateFilters,
    generateRequest: generateRequestMany,
    libOptions,
    addPaginationToArgs: ({ args: [filters], cursor, count }) => ({
      ...filters,
      after: cursor,
      ...(count ? { limit: count } : {}),
    }),
  });

  const getMassTransferTxs: IGetMassTransferTxs = (
    idOrFilters?: string | IMassTransferTxFilters,
  ) =>
    typeof idOrFilters === 'string'
      ? getMassTransferTxsOne(idOrFilters)
      : getMassTransferTxsMany(idOrFilters === undefined ? {} : idOrFilters);

  return getMassTransferTxs;
};

export default createGetMassTransferTxs;
