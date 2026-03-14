import {
  type SignedTransaction,
  type Transaction,
  type TransactionMap,
  type WithApiMixin,
} from '@decentralchain/ts-types';
import { TRANSACTION_STATUSES, type TTransactionStatuses } from '../../constants';
import { type IWithApplicationStatus, type TLong } from '../../interface';
import query from '../../tools/query';
import request from '../../tools/request';
import stringify from '../../tools/stringify';
import { addStateUpdateField, type TTransaction } from '../../tools/transactions/transactions';
import { deepAssign, pathSegment } from '../../tools/utils';
import { fetchHeight } from '../blocks';

/**
 * GET /transactions/unconfirmed/size
 * Number of unconfirmed transactions
 */
export function fetchUnconfirmedSize(base: string): Promise<IUnconfirmedSize> {
  return request({
    base,
    url: '/transactions/unconfirmed/size',
  });
}

interface IUnconfirmedSize {
  size: number;
}

// NOTE: Requires node API key
/**
 * POST /transactions/sign/{signerAddress}
 * Sign a transaction with a non-default private key
 */

/**
 * POST /transactions/calculateFee
 * Calculate transaction fee
 */
export function fetchCalculateFee<T extends keyof TransactionMap<TLong>>(
  base: string,
  tx: Partial<TransactionMap<TLong>[T]> & { type: T },
  options: RequestInit = {},
): Promise<TFeeInfo> {
  return request({
    base,
    options: deepAssign(
      { ...options },
      {
        body: stringify(tx),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    ),
    url: '/transactions/calculateFee',
  });
}

export interface TFeeInfo<LONG = TLong> {
  feeAssetId: string | null;
  feeAmount: LONG;
}

/**
 * GET /transactions/unconfirmed
 * Unconfirmed transactions
 */
export function fetchUnconfirmed(
  base: string,
  options: RequestInit = {},
): Promise<(Transaction<TLong> & WithApiMixin)[]> {
  return request({
    base,
    options,
    url: '/transactions/unconfirmed',
  });
}

/**
 * Fetch transactions for a given address.
 * @param address   The address to query transactions for.
 * @param limit     Maximum number of transactions to return.
 * @param after     Return transactions after this transaction ID.
 * @param _retry    Number of retry attempts for the request (unused, reserved).
 */
export function fetchTransactions(
  base: string,
  address: string,
  limit: number,
  after?: string,
  _retry?: number,
  options: RequestInit = {},
): Promise<(Transaction<TLong> & WithApiMixin)[]> {
  return request<(TTransaction<TLong> & WithApiMixin & IWithApplicationStatus)[][]>({
    base,
    options,
    url: `/transactions/address/${pathSegment(address)}/limit/${pathSegment(limit)}${query({ after })}`,
  }).then(([list]) => {
    if (!list) return [];
    list.forEach((transaction) => {
      addStateUpdateField(transaction);
    });
    // EthereumTransaction is not in @decentralchain/ts-types Transaction union;
    // bridge via unknown to preserve the public API type
    return list as unknown as (Transaction<TLong> & WithApiMixin)[];
  });
}

/**
 * GET /transactions/unconfirmed/info/{id}
 * Unconfirmed transaction info
 */
export function fetchUnconfirmedInfo(
  base: string,
  id: string,
  options: RequestInit = {},
): Promise<Transaction<TLong> & WithApiMixin> {
  return request({
    base,
    options,
    url: `/transactions/unconfirmed/info/${pathSegment(id)}`,
  });
}

// NOTE: Requires node API key
/**
 * POST /transactions/sign
 * Sign a transaction
 */

/**
 * GET /transactions/info/{id}
 * Transaction info
 */

export function fetchInfo(
  base: string,
  id: string,
  options: RequestInit = {},
): Promise<TTransaction<TLong> & WithApiMixin & IWithApplicationStatus> {
  return request<TTransaction<TLong> & WithApiMixin & IWithApplicationStatus>({
    base,
    options,
    url: `/transactions/info/${pathSegment(id)}`,
  }).then((transaction) => addStateUpdateField(transaction));
}

/**
 * GET /transactions/info?id=...&id=...
 * Batch-fetch transaction info by multiple IDs in a single request.
 */
export function fetchMultipleInfo(
  base: string,
  ids: string[],
  options: RequestInit = {},
): Promise<(TTransaction<TLong> & WithApiMixin & IWithApplicationStatus)[]> {
  return request<(TTransaction<TLong> & WithApiMixin & IWithApplicationStatus)[]>({
    base,
    options,
    url: `/transactions/info${query({ id: ids })}`,
  });
}

/**
 * POST /transactions/status
 * Batch-fetch the status of multiple transactions in a single HTTP request.
 * Falls back to per-ID polling only if the batch endpoint is unavailable.
 */
export function fetchStatus(base: string, list: string[]): Promise<ITransactionsStatus> {
  return Promise.all([
    fetchHeight(base),
    request<IBatchStatusResponse[]>({
      base,
      options: {
        body: JSON.stringify({ ids: list }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      },
      url: '/transactions/status',
    }),
  ]).then(([{ height }, batchStatuses]) => ({
    height,
    statuses: batchStatuses.map((item) => ({
      applicationStatus: item.applicationStatus,
      confirmations:
        item.status === TRANSACTION_STATUSES.IN_BLOCKCHAIN && item.height != null
          ? height - item.height
          : -1,
      height: item.height ?? -1,
      id: item.id,
      inUTX: item.status === TRANSACTION_STATUSES.UNCONFIRMED,
      status: item.status,
    })),
  }));
}

/** Raw response shape from POST /transactions/status */
interface IBatchStatusResponse {
  id: string;
  status: TTransactionStatuses;
  height?: number;
  confirmations?: number;
  applicationStatus?: 'succeed' | 'script_execution_failed';
}

export interface ITransactionsStatus {
  height: number;
  statuses: ITransactionStatus[];
}

export interface ITransactionStatus {
  id: string;
  status: TTransactionStatuses;
  inUTX: boolean;
  confirmations: number;
  height: number;
  applicationStatus?: 'succeed' | 'script_execution_failed' | undefined;
}

export function broadcast<T extends SignedTransaction<Transaction<TLong>>>(
  base: string,
  tx: T,
  options: RequestInit = {},
): Promise<T & WithApiMixin> {
  return request<T & WithApiMixin>({
    base,
    options: deepAssign(
      { ...options },
      {
        body: stringify(tx),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    ),
    url: '/transactions/broadcast',
  });
}
