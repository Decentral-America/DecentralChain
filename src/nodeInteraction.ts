import * as addresses_route from '@decentralchain/node-api-js/api-node/addresses';
import * as assets_route from '@decentralchain/node-api-js/api-node/assets';
import * as blocks_route from '@decentralchain/node-api-js/api-node/blocks';
import * as debug_route from '@decentralchain/node-api-js/api-node/debug';
import { type TStateChanges } from '@decentralchain/node-api-js/api-node/debug';
import * as rewards_route from '@decentralchain/node-api-js/api-node/rewards';
import * as tx_route from '@decentralchain/node-api-js/api-node/transactions';
import {
  type DataTransactionEntry,
  type Long,
  type SignedTransaction,
  type Transaction,
  type WithApiMixin,
} from '@decentralchain/ts-types';

export type CancellablePromise<T> = Promise<T> & { cancel: () => void };

const delay = (timeout: number): CancellablePromise<object> => {
  let resolve: (value: object | PromiseLike<object>) => void;
  let id: ReturnType<typeof setTimeout>;

  const p = new Promise<object>((res) => {
    resolve = res;
    id = setTimeout(() => res({}), timeout);
  }) as CancellablePromise<object>;

  p.cancel = () => {
    resolve({});
    clearTimeout(id);
  };

  return p;
};

const rerun = <T>(f: () => Promise<T>, expired: boolean, t = 1000): Promise<T> =>
  delay(t).then((_) => (expired ? Promise.reject(new Error('Tx wait stopped: timeout')) : f()));

export interface INodeRequestOptions {
  timeout?: number;
  apiBase: string;
}

const DEFAULT_NODE_REQUEST_OPTIONS = {
  timeout: 120000,
  apiBase: 'https://mainnet-node.decentralchain.io/',
};

export const currentHeight = async (apiBase: string): Promise<number> => {
  return blocks_route.fetchHeight(apiBase).then(({ height }) => height);
};

export async function waitForHeight(height: number, options: INodeRequestOptions) {
  const { timeout, apiBase } = { ...DEFAULT_NODE_REQUEST_OPTIONS, ...options };

  let expired = false;
  const to = delay(timeout);
  void to.then(() => {
    expired = true;
  });

  const promise = (): Promise<number> =>
    currentHeight(apiBase)
      .then((x) => {
        if (x >= height) {
          to.cancel();
          return x;
        } else {
          return rerun(promise, expired, 10000);
        }
      })
      .catch((_) => rerun(promise, expired));

  return promise();
}

/** Transaction info returned by the node API — includes id, sender, height, and applicationStatus */
type TxInfo = Awaited<ReturnType<typeof tx_route.fetchInfo>>;

/**
 * Resolves when specified txId is mined into block
 * @param txId - DCC address as base58 string
 * @param options
 */
export async function waitForTx(
  txId: string,
  options: INodeRequestOptions,
  requestOptions?: RequestInit,
): Promise<TxInfo> {
  const { timeout, apiBase } = { ...DEFAULT_NODE_REQUEST_OPTIONS, ...options };

  let expired = false;
  const to = delay(timeout);
  void to.then(() => {
    expired = true;
  });

  const promise = (): Promise<TxInfo> =>
    tx_route
      .fetchInfo(apiBase, txId, requestOptions)
      .then((x) => {
        to.cancel();
        return x;
      })
      .catch((e: Record<string, unknown>) => {
        // Non-retriable HTTP errors: fail immediately instead of wasting the timeout
        const status = (e as Record<string, unknown>)?.response
          ? (e as Record<string, { status?: number }>).response?.status
          : ((e as Record<string, unknown>)?.status ?? (e as Record<string, unknown>)?.code);
        if (
          status === 400 ||
          status === 401 ||
          status === 403 ||
          status === 405 ||
          status === 422
        ) {
          to.cancel();
          return Promise.reject(
            new Error(
              `waitForTx failed with non-retriable error (HTTP ${status}): ${e?.message ?? e}`,
            ),
          );
        }
        // 404 means tx not yet in a block — keep polling
        // 500/502/503 could be transient — keep polling
        return delay(1000).then((_) =>
          expired ? Promise.reject(new Error('Tx wait stopped: timeout')) : promise(),
        );
      });

  return promise();
}

export async function waitForTxWithNConfirmations(
  txId: string,
  confirmations: number,
  options: INodeRequestOptions,
  _requestOptions?: RequestInit,
): Promise<TxInfo> {
  const { timeout } = { ...DEFAULT_NODE_REQUEST_OPTIONS, ...options };

  let expired = false;
  const to = delay(timeout);
  void to.then(() => {
    expired = true;
  });

  let tx = await waitForTx(txId, options, _requestOptions);

  let txHeight: number = tx.height;
  let chainHeight: number = tx.height;

  while (txHeight + confirmations > chainHeight) {
    if (expired) throw new Error('Tx wait stopped: timeout');
    await waitForHeight(txHeight + confirmations, options);
    tx = await waitForTx(txId, options, _requestOptions);
    txHeight = tx.height;
    chainHeight = await currentHeight(options.apiBase || DEFAULT_NODE_REQUEST_OPTIONS.apiBase);
  }

  return tx;
}

export async function waitNBlocks(
  blocksCount: number,
  options: INodeRequestOptions = DEFAULT_NODE_REQUEST_OPTIONS,
  _requestOptions?: RequestInit,
) {
  const { apiBase } = { ...DEFAULT_NODE_REQUEST_OPTIONS, ...options };
  const height = await currentHeight(apiBase);
  const target = height + blocksCount;
  // console.log(`current height: ${height} target: ${target}`)
  return await waitForHeight(target, options);
}

/**
 * Get account effective balance
 * @param txId - transaction ID as base58 string
 * @param nodeUrl - node address to ask balance from. E.g. https://nodes.decentralchain.io/
 */
export async function transactionById(
  txId: string,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<TxInfo> {
  return tx_route.fetchInfo(nodeUrl, txId, requestOptions);
}

/**
 * Get account effective balance
 * @param address - DCC address as base58 string
 * @param nodeUrl - node address to ask balance from. E.g. https://nodes.decentralchain.io/
 */
export async function balance(
  address: string,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<string | number> {
  return addresses_route.fetchBalance(nodeUrl, address, requestOptions).then((d) => {
    const raw = d.balance;
    const n = Number(raw);
    return Number.isSafeInteger(n) ? n : String(raw);
  });
}

/**
 * Retrieve full information about DCC account balance. Effective, generating etc
 * @param address - DCC address as base58 string
 * @param nodeUrl - node address to ask balance from. E.g. https://nodes.decentralchain.io/
 */
export async function balanceDetails(
  address: string,
  nodeUrl: string,
  requestOptions?: RequestInit,
): ReturnType<typeof addresses_route.fetchBalanceDetails> {
  return addresses_route.fetchBalanceDetails(nodeUrl, address, requestOptions);
}

/**
 * Retrieve information about specific asset account balance
 * @param assetId - id of asset
 * @param address - DCC address as base58 string
 * @param nodeUrl - node address to ask balance from. E.g. https://nodes.decentralchain.io/
 */
export async function assetBalance(
  assetId: string,
  address: string,
  nodeUrl: string,
  requestOptions?: RequestInit,
) {
  return assets_route
    .fetchBalanceAddressAssetId(nodeUrl, address, assetId, requestOptions)
    .then((x) => x.balance);
}

export interface IAccountDataRequestOptions {
  address: string;
  match?: string | RegExp;
}

/**
 * Get full account dictionary
 * @param options - DCC address and optional match regular expression. If match is present keys will be filtered by this regexp
 * @param nodeUrl - node address to ask data from. E.g. https://nodes.decentralchain.io/
 */
export async function accountData(
  options: IAccountDataRequestOptions,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<Record<string, DataTransactionEntry>>;
export async function accountData(
  address: string,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<Record<string, DataTransactionEntry>>;
export async function accountData(
  options: string | IAccountDataRequestOptions,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<Record<string, DataTransactionEntry>> {
  let address: string;
  let match: string | undefined;
  if (typeof options === 'string') {
    address = options;
    match = undefined;
  } else {
    address = options.address;
    // Sanitize regex: limit length to prevent ReDoS on node side
    if (options.match) {
      const raw = typeof options.match === 'string' ? options.match : options.match.source;
      if (raw.length > 255) {
        throw new Error('accountData match pattern exceeds maximum length (255)');
      }
      match = encodeURIComponent(raw);
    }
  }

  const data = await addresses_route.data(nodeUrl, address, { matches: match }, requestOptions);

  const result: Record<string, DataTransactionEntry> = {};
  for (const item of data) {
    result[item.key] = item;
  }
  return result;
}

/**
 * Get data from account dictionary by key
 * @param address - DCC address as base58 string
 * @param key - dictionary key
 * @param nodeUrl - node address to ask data from. E.g. https://nodes.decentralchain.io/
 */
export async function accountDataByKey(
  key: string,
  address: string,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<DataTransactionEntry<Long> | null> {
  return addresses_route.fetchDataKey(nodeUrl, address, key, requestOptions).catch((e) => {
    if (e.error === 304) return null;
    else throw e;
  });
}

/**
 * Get account script info
 * @param address - DCC address as base58 string
 * @param nodeUrl - node address to ask data from. E.g. https://nodes.decentralchain.io/
 */
export async function scriptInfo(
  address: string,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<Record<string, unknown>> {
  return addresses_route.fetchScriptInfo(nodeUrl, address, requestOptions) as Promise<
    Record<string, unknown>
  >;
}

/**
 * Get account script meta, i.e., available callable functions
 * @param address - DCC address as base58 string
 * @param nodeUrl - node address to ask data from. E.g. https://nodes.decentralchain.io/
 */
export async function scriptMeta(
  address: string,
  nodeUrl: string,
): Promise<Record<string, unknown>> {
  return addresses_route.fetchScriptInfoMeta(nodeUrl, address) as Promise<Record<string, unknown>>;
}

/**
 * Get miner’s reward status and total supply
 * @param nodeUrl - node address to ask data from. E.g. https://nodes.decentralchain.io/
 */
export async function rewards(nodeUrl: string, requestOptions?: RequestInit): Promise<unknown>;
/**
 * Get miner's reward status at height and total supply
 * @param height - block number to get info
 * @param nodeUrl - node address to ask data from. E.g. https://nodes.decentralchain.io/
 */
export async function rewards(
  height: number,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<unknown>;
export async function rewards(
  ...args: [number, string, RequestInit?] | [string, RequestInit?]
): Promise<unknown> {
  let nodeUrl: string;
  let _height: number | undefined;
  let requestOptions: RequestInit | undefined;
  if (typeof args[0] === 'number') {
    [_height, nodeUrl, requestOptions] = args as [number, string, RequestInit?];
  } else {
    [nodeUrl, requestOptions] = args as [string, RequestInit?];
  }

  return rewards_route.fetchRewards(nodeUrl, _height, requestOptions);
}

/** @deprecated Use TStateChanges from @decentralchain/node-api-js/api-node/debug */
export type IStateChangeResponse = TStateChanges;

/**
 * Get invokeScript tx state changes
 * @param transactionId - invokeScript transaction id as base58 string
 * @param nodeUrl - node address to ask data from. E.g. https://nodes.decentralchain.io/
 */
export async function stateChanges(
  transactionId: string,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<TStateChanges> {
  const tx = await debug_route.fetchStateChangesByTxId(nodeUrl, transactionId, requestOptions);
  return tx.stateChanges;
}

/**
 * Sends transaction to DCC node
 * IMPORTANT: You cannot broadcast order. Orders should be sent to matcher via submitOrder method
 * @param tx - transaction to send
 * @param nodeUrl - node address to send tx to. E.g. https://nodes.decentralchain.io/
 */
export function broadcast<T extends SignedTransaction<Transaction<Long>>>(
  tx: T,
  nodeUrl: string,
  requestOptions?: RequestInit,
): Promise<T & WithApiMixin> {
  return tx_route.broadcast(
    nodeUrl,
    tx as unknown as Parameters<typeof tx_route.broadcast>[1],
    requestOptions,
  );
}
