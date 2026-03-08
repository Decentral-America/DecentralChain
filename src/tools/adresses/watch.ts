import { type Transaction, type WithApiMixin } from '@decentralchain/ts-types';
import { EventEmitter } from 'typed-ts-events';
import { fetchTransactions } from '../../api-node/transactions';
import { type TLong } from '../../interface';
import { indexBy, keys, prop } from '../utils';

/** @public — exposed via create().tools.addresses.watch() return type */
export class Watch extends EventEmitter<IEvents> {
  public readonly address: string;
  private readonly _base: string;
  private readonly _interval: number;
  private _lastBlock: ILastBlockInfo;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _stopped = false;

  constructor(
    base: string,
    address: string,
    tx: (Transaction<TLong> & WithApiMixin) | null,
    interval?: number,
  ) {
    super();
    this.address = address;
    this._interval = interval ?? 1000;
    this._base = base;
    this._lastBlock = {
      lastId: tx?.id ?? '',
      height: tx?.height ?? 0,
      transactions: tx ? [tx] : [],
    };

    this._addTimeout();
  }

  /**
   * Stop polling and release all timers.
   * Once stopped the instance cannot be restarted.
   */
  public stop(): void {
    this._stopped = true;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /** Whether the watcher has been stopped. */
  public get isStopped(): boolean {
    return this._stopped;
  }

  private _run() {
    if (this._stopped) return;

    if (this._timer) {
      clearTimeout(this._timer);
    }

    const onError = () => {
      this._addTimeout();
    };

    fetchTransactions(this._base, this.address, 1)
      .then(([tx]) => {
        if (!tx) {
          this._addTimeout();
          return null;
        }

        this.getTransactionsInHeight(tx, 310).then((list) => {
          const hash = Watch._groupByHeight(list);
          const heightList = keys(hash)
            .map(Number)
            .sort((a, b) => b - a);
          const last = heightList[0];
          const prev = heightList[1];

          if (last === undefined) {
            this._addTimeout();
            return;
          }

          const lastTxs = hash[last] ?? [];
          const prevTxs = prev !== undefined ? (hash[prev] ?? []) : [];

          if (!this._lastBlock.height) {
            this._lastBlock = {
              height: last,
              lastId: prevTxs.length ? (prevTxs[0]?.id ?? '') : '',
              transactions: lastTxs,
            };
            this.trigger('change-state', list);
          } else {
            const wasDispatchHash = indexBy(prop('id'), this._lastBlock.transactions);
            const toDispatch = Watch._getTransactionsToDispatch(
              [...lastTxs, ...prevTxs],
              wasDispatchHash,
              this._lastBlock.lastId,
            );

            if (this._lastBlock.height !== last) {
              this._lastBlock = {
                height: last,
                lastId: prevTxs.length ? (prevTxs[0]?.id ?? '') : '',
                transactions: lastTxs,
              };
            } else {
              this._lastBlock.transactions.push(...toDispatch);
            }

            if (toDispatch.length) {
              this.trigger('change-state', toDispatch);
            }
          }
          this._addTimeout();
        }, onError);
      })
      .catch(onError);
  }

  private getTransactionsInHeight(
    from: Transaction<TLong> & WithApiMixin,
    limit: number,
  ): Promise<(Transaction<TLong> & WithApiMixin)[]> {
    const height = from.height;

    const loop = (
      downloaded: (Transaction<TLong> & WithApiMixin)[],
    ): Promise<(Transaction<TLong> & WithApiMixin)[]> => {
      if (downloaded.length >= limit) {
        return Promise.resolve(downloaded);
      }

      return fetchTransactions(this._base, this.address, downloaded.length + 100).then((list) => {
        if (downloaded.length === list.length) {
          return downloaded;
        }
        const hash = Watch._groupByHeight(list);
        const heightList = keys(hash)
          .map(Number)
          .sort((a, b) => b - a);
        const last = heightList[0];
        const prev = heightList[1];

        if (last === height) {
          const lastTxs = hash[last] ?? [];
          if (prev !== undefined) {
            const prevTxs = hash[prev] ?? [];
            const firstPrev = prevTxs[0];
            return firstPrev ? [...lastTxs, firstPrev] : loop(list);
          }
          return loop(list);
        } else {
          return loop(list);
        }
      });
    };

    return loop([from]);
  }

  private _addTimeout(): void {
    if (this._stopped) return;

    this._timer = setTimeout(() => {
      this._run();
    }, this._interval);
  }

  private static _groupByHeight(
    list: (Transaction<TLong> & WithApiMixin)[],
  ): Record<number, (Transaction<TLong> & WithApiMixin)[]> {
    return list.reduce<Record<number, (Transaction<TLong> & WithApiMixin)[]>>((hash, tx) => {
      const existing = hash[tx.height];
      if (!existing) {
        hash[tx.height] = [tx];
      } else {
        existing.push(tx);
      }
      return hash;
    }, {});
  }

  private static _getTransactionsToDispatch(
    list: (Transaction<TLong> & WithApiMixin)[],
    dispatched: Record<string, Transaction<TLong> & WithApiMixin>,
    lastId: string,
  ): (Transaction<TLong> & WithApiMixin)[] {
    const result: (Transaction<TLong> & WithApiMixin)[] = [];
    for (const tx of list) {
      if (tx.id === lastId) {
        break;
      }
      if (!dispatched[tx.id]) {
        result.push(tx);
      }
    }
    return result;
  }
}

interface ILastBlockInfo {
  height: number;
  lastId: string;
  transactions: (Transaction<TLong> & WithApiMixin)[];
}

interface IEvents {
  'change-state': (Transaction<TLong> & WithApiMixin)[];
}

export default function (base: string, address: string, interval?: number) {
  return fetchTransactions(base, address, 1).then(
    ([tx]) => new Watch(base, address, tx ?? null, interval),
  );
}
