import { type Transaction, type TransactionMap, type WithApiMixin } from '@decentralchain/ts-types';
import * as activationModule from './api-node/activation';
import * as addressesModule from './api-node/addresses';
import * as aliasModule from './api-node/alias';
import * as assetsModule from './api-node/assets';
import * as blocksModule from './api-node/blocks';
import * as consensusModule from './api-node/consensus';
import * as debugModule from './api-node/debug';
import * as ethModule from './api-node/eth';
import * as leasingModule from './api-node/leasing';
import * as nodeModule from './api-node/node';
import * as peersModule from './api-node/peers';
import * as rewardsModule from './api-node/rewards';
import * as transactionsModule from './api-node/transactions';
import * as utilsModule from './api-node/utils';
import { type TLong } from './interface';
import availableSponsoredBalances from './tools/adresses/availableSponsoredBalances';
import getAssetIdListByTx from './tools/adresses/getAssetIdListByTx';
import getAssetsByTransaction from './tools/adresses/getAssetsByTransaction';
import getTransactionsWithAssets from './tools/adresses/getTransactionsWithAssets';
import createWatch from './tools/adresses/watch';
import getNetworkByte from './tools/blocks/getNetworkByte';
import getNetworkCode from './tools/blocks/getNetworkCode';
import parse from './tools/parse';
import query from './tools/query';
import request from './tools/request';
import resolve from './tools/resolve';
import broadcast, {
  type IOptions,
  type TMap,
  type TMapTuple,
} from './tools/transactions/broadcast';
import wait from './tools/transactions/wait';
import * as toolsUtilsModule from './tools/utils';

type BroadcastWrapped = {
  <T extends Transaction<TLong>[]>(
    list: T,
    options?: Partial<IOptions>,
  ): Promise<TMapTuple<T, TransactionMap<TLong>, 'type'> & WithApiMixin>;
  <T extends Transaction<TLong>>(
    tx: T,
    options?: Partial<IOptions>,
  ): Promise<TMap<TransactionMap<TLong>, T['type'] & WithApiMixin>>;
};

// biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
type ApiFunction = (base: string, ...args: any[]) => any;

type TWrapRecord<T extends Record<string, ApiFunction>> = {
  [Key in keyof T]: TWrapApi<T[Key]>;
};
type TWrapApi<T extends ApiFunction> = T extends (base: string, ...args: infer NEXT) => infer R
  ? (...args: NEXT) => R
  : never;

export function create(base: string) {
  const addresses: TWrapRecord<typeof addressesModule> = wrapRecord(base, addressesModule);
  const blocks: TWrapRecord<typeof blocksModule> = wrapRecord(base, blocksModule);
  const transactions: TWrapRecord<typeof transactionsModule> = wrapRecord(base, transactionsModule);
  const leasing: TWrapRecord<typeof leasingModule> = wrapRecord(base, leasingModule);
  const peers: TWrapRecord<typeof peersModule> = wrapRecord(base, peersModule);
  const rewards: TWrapRecord<typeof rewardsModule> = wrapRecord(base, rewardsModule);
  const utils: TWrapRecord<typeof utilsModule> = wrapRecord(base, utilsModule);
  const debug: TWrapRecord<typeof debugModule> = wrapRecord(base, debugModule);
  const alias: TWrapRecord<typeof aliasModule> = wrapRecord(base, aliasModule);
  const consensus: TWrapRecord<typeof consensusModule> = wrapRecord(base, consensusModule);
  const activation: TWrapRecord<typeof activationModule> = wrapRecord(base, activationModule);
  const node: TWrapRecord<typeof nodeModule> = wrapRecord(base, nodeModule);
  const assets: TWrapRecord<typeof assetsModule> = wrapRecord(base, assetsModule);
  const eth: TWrapRecord<typeof ethModule> = wrapRecord(base, ethModule);

  const tools = {
    transactions: {
      broadcast: wrapRequest(base, broadcast) as BroadcastWrapped,
      wait: wrapRequest(base, wait),
    },
    blocks: {
      getNetworkByte: wrapRequest(base, getNetworkByte),
      getNetworkCode: wrapRequest(base, getNetworkCode),
    },
    addresses: {
      createWatch: wrapRequest(base, createWatch),
      getAssetsByTransaction: wrapRequest(base, getAssetsByTransaction),
      getAssetIdListByTx,
      getTransactionsWithAssets: wrapRequest(base, getTransactionsWithAssets),
      availableSponsoredBalances: wrapRequest(base, availableSponsoredBalances),
    },
    utils: toolsUtilsModule,
    query,
    resolve,
    request,
    parse,
  };

  return {
    addresses,
    blocks,
    transactions,
    leasing,
    tools,
    peers,
    rewards,
    utils,
    debug,
    alias,
    consensus,
    activation,
    node,
    assets,
    eth,
  };
}

function wrapRecord<T extends Record<string, ApiFunction>>(base: string, hash: T): TWrapRecord<T> {
  return Object.keys(hash).reduce<TWrapRecord<T>>(
    (acc, methodName: keyof T) => {
      acc[methodName] = wrapRequest(base, hash[methodName]);
      return acc;
    },
    {} as TWrapRecord<T>,
  );
}

function wrapRequest<T extends ApiFunction>(base: string, callback: T): TWrapApi<T> {
  return callback.bind(null, base) as TWrapApi<T>;
}
