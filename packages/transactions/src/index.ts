// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

export {
  cancelSubmittedOrder,
  serialize,
  signTx,
  submitOrder,
  verify,
  verifyAuthData,
  verifyCustomData,
  verifyDccAuthData,
} from './general';
export { makeTx, makeTxBytes } from './make-tx';
export type { INodeRequestOptions, IStateChangeResponse } from './nodeInteraction';
export { broadcast, waitForTx } from './nodeInteraction';
export { auth } from './requests/auth';
export { cancelOrder } from './requests/cancel-order';
export { customData, serializeCustomData } from './requests/custom-data';
export { dccAuth } from './requests/dccAuth';
export { order } from './requests/order';
// Export interfaces
export type {
  IAliasParams,
  IBurnParams,
  ICancelLeaseParams,
  ICancelOrder,
  ICancelOrderParams,
  IDataParams,
  IDeleteDataEntry,
  IInvokeScriptParams,
  IIssueParams,
  ILeaseParams,
  IMassTransferParams,
  IOrderParams,
  IReissueParams,
  ISetAssetScriptParams,
  ISetScriptParams,
  ISponsorshipParams,
  ITransferParams,
  IUpdateAssetInfoParams,
  TTransaction,
  TTransactionType,
  TTx,
  TTxParams,
  WithId,
  WithProofs,
  WithSender,
  WithTxType,
} from './transactions';
export { alias } from './transactions/alias';
export { burn } from './transactions/burn';
export { cancelLease } from './transactions/cancel-lease';
export { data } from './transactions/data';
export { exchange } from './transactions/exchange';
export { invokeScript } from './transactions/invoke-script';
export { issue } from './transactions/issue';
export { lease } from './transactions/lease';
export { massTransfer } from './transactions/mass-transfer';
export { reissue } from './transactions/reissue';
export { setAssetScript } from './transactions/set-asset-script';
export { setScript } from './transactions/set-script';
export { sponsorship } from './transactions/sponsorship';
export { transfer } from './transactions/transfer';
export { updateAssetInfo } from './transactions/update-asset-info';

export type { TOption, TSeedTypes } from './types';

import * as marshall from '@decentralchain/marshall';
// internal libraries access
import * as crypto from '@decentralchain/ts-lib-crypto';

const libs = {
  crypto,
  marshall,
};

import * as nodeInteraction from './nodeInteraction';
import * as protoSerialize from './proto-serialize';
import * as seedUtils from './seedUtils';
import * as validators from './validators';

export { libs, nodeInteraction, protoSerialize, seedUtils, validators };
