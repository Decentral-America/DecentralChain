import { TRANSACTION_STATUSES, type TTransactionStatuses } from '../../constants';
import { type IWithApplicationStatus, type TLong } from '../../interface';
import { fetchHeight } from '../blocks';
import request from '../../tools/request';
import query from '../../tools/query';
import { deepAssign, pathSegment } from '../../tools/utils';
import stringify from '../../tools/stringify';
import {
  type SignedTransaction,
  type Transaction,
  type TransactionMap,
  type WithApiMixin,
} from '@decentralchain/ts-types';
import { addStateUpdateField, type TTransaction } from '../../tools/transactions/transactions';

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

// @TODO: when correct API key is received
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
    url: '/transactions/calculateFee',
    options: deepAssign(
      { ...options },
      {
        method: 'POST',
        body: stringify(tx),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ),
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
    url: '/transactions/unconfirmed',
    options,
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
    url: `/transactions/address/${pathSegment(address)}/limit/${pathSegment(limit)}${query({ after })}`,
    options,
  }).then(([list]) => {
    if (!list) return [];
    list.forEach((transaction) => addStateUpdateField(transaction));
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
    url: `/transactions/unconfirmed/info/${pathSegment(id)}`,
    options,
  });
}

// @TODO when correct API key is received
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
    url: `/transactions/info/${pathSegment(id)}`,
    options,
  }).then((transaction) => addStateUpdateField(transaction));
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
      url: '/transactions/status',
      options: {
        method: 'POST',
        body: JSON.stringify({ ids: list }),
        headers: { 'Content-Type': 'application/json' },
      },
    }),
  ]).then(([{ height }, batchStatuses]) => ({
    height,
    statuses: batchStatuses.map((item) => ({
      id: item.id,
      status: item.status,
      inUTX: item.status === TRANSACTION_STATUSES.UNCONFIRMED,
      height: item.height ?? -1,
      confirmations:
        item.status === TRANSACTION_STATUSES.IN_BLOCKCHAIN && item.height != null
          ? height - item.height
          : -1,
      applicationStatus: item.applicationStatus,
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
    url: '/transactions/broadcast',
    options: deepAssign(
      { ...options },
      {
        method: 'POST',
        body: stringify(tx),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    ),
  });
}
