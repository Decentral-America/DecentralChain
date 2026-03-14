import { type Transaction, type WithApiMixin } from '@decentralchain/ts-types';
import { fetchStatus } from '../../api-node/transactions';
import { TRANSACTION_STATUSES } from '../../constants';
import { type TLong } from '../../interface';
import { head, indexBy, prop, toArray, wait } from '../utils';

/**
 * Default maximum wait time (5 minutes).
 * Prevents infinite polling if a transaction is never confirmed.
 */
const DEFAULT_MAX_WAIT_MS = 5 * 60 * 1000;

export default function <T extends Transaction<TLong> & WithApiMixin>(
  base: string,
  tx: T,
  options?: IWaitOptions,
): Promise<T>;
export default function <T extends Transaction<TLong> & WithApiMixin>(
  base: string,
  list: T[],
  options?: IWaitOptions,
): Promise<T[]>;
export default function <T extends Transaction<TLong> & WithApiMixin>(
  base: string,
  tx: T | T[],
  options?: IWaitOptions,
): Promise<T | T[]>;
export default function <T extends Transaction<TLong> & WithApiMixin>(
  base: string,
  tx: T | T[],
  options?: IWaitOptions,
): Promise<T | T[]> {
  const isOnce = !Array.isArray(tx);
  const start = Date.now();
  const confirmed: T[] = [];
  const confirmations = options?.confirmations ?? 0;
  const maxWaitTime = options?.maxWaitTime ?? DEFAULT_MAX_WAIT_MS;
  const requestInterval = options?.requestInterval ?? 250;

  const waitTx = (list: T[]): Promise<void> => {
    return fetchStatus(base, list.map(prop('id'))).then((status) => {
      const hash = indexBy(prop('id'), status.statuses);
      const hasError = list.some((tx) => {
        const entry = hash[tx.id];
        return !entry || entry.status === TRANSACTION_STATUSES.NOT_FOUND;
      });

      if (hasError) {
        throw new Error('One transaction is not in blockchain!');
      }

      const toRequest = list.filter((tx) => {
        const entry = hash[tx.id];
        if (entry && entry.confirmations >= confirmations) {
          confirmed.push(tx);
          return false;
        } else {
          return true;
        }
      });

      if (!toRequest.length) {
        return void 0;
      }
      if (Date.now() - start > maxWaitTime) {
        return Promise.reject(
          new Error(`Transaction wait timed out after ${String(maxWaitTime)} ms`),
        );
      }
      return wait(requestInterval).then(() => waitTx(toRequest));
    });
  };

  return waitTx(toArray(tx)).then(() => {
    if (isOnce) {
      const first = head(confirmed);
      if (!first) throw new Error('Transaction not confirmed');
      return first;
    }
    return confirmed;
  });
}

/** @public — exposed via create().tools.transactions.wait() parameter type */
export interface IWaitOptions {
  confirmations?: number;
  maxWaitTime?: number;
  requestInterval?: number;
}
