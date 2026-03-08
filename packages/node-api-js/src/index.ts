import { create as createFn } from './create';
import dccAddress2eth from './tools/adresses/dccAddress2eth';
import ethAddress2dcc from './tools/adresses/ethAddress2dcc';
import dccAsset2Eth from './tools/assets/dccAsset2eth';
import request from './tools/request';
import stringify from './tools/stringify';
import ethTxId2dcc from './tools/transactions/ethTxId2dcc';

export { dccAddress2eth, ethAddress2dcc, dccAsset2Eth, ethTxId2dcc, request, stringify };

// Tools re-exports used by @decentralchain/signer and other consumers
export { default as getNetworkByte } from './tools/blocks/getNetworkByte';
export type { IOptions as IBroadcastOptions } from './tools/transactions/broadcast';
export { default as broadcastTx } from './tools/transactions/broadcast';
export type { IWaitOptions } from './tools/transactions/wait';
export { default as waitForTx } from './tools/transactions/wait';

export const create = createFn;

export default createFn;

export type {
  ICallableFuncArgumentType,
  TCallableFuncArguments,
  TCallableFuncArgumentsArray,
  TCallableFuncArgumentsRecord,
} from './api-node/addresses';

export type {
  TRANSACTION_NAME_MAP,
  TRANSACTION_TYPE_MAP,
} from './interface';
export {
  isCallableFuncArrayArguments,
  isCallableFuncRecordArguments,
} from './interface';
