import dccAddress2eth from './tools/adresses/dccAddress2eth';
import ethAddress2dcc from './tools/adresses/ethAddress2dcc';
import dccAsset2Eth from './tools/assets/dccAsset2eth';
import ethTxId2dcc from './tools/transactions/ethTxId2dcc';
import request from './tools/request';
import stringify from './tools/stringify';

import { create as createFn } from './create';

export { dccAddress2eth, ethAddress2dcc, dccAsset2Eth, ethTxId2dcc, request, stringify };

// Tools re-exports used by @decentralchain/signer and other consumers
export { default as getNetworkByte } from './tools/blocks/getNetworkByte';
export { default as broadcastTx } from './tools/transactions/broadcast';
export { default as waitForTx } from './tools/transactions/wait';
export type { IWaitOptions } from './tools/transactions/wait';
export type { IOptions as IBroadcastOptions } from './tools/transactions/broadcast';

export const create = createFn;

export default createFn;

export type {
  ICallableFuncArgumentType,
  TCallableFuncArgumentsArray,
  TCallableFuncArgumentsRecord,
  TCallableFuncArguments,
} from './api-node/addresses';
