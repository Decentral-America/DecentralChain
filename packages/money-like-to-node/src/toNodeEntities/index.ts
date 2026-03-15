import {
  type ExchangeTransactionOrder,
  type SignableTransaction,
  type SignedIExchangeTransactionOrder,
  type SponsorshipTransaction,
  type TransactionMap,
} from '@decentralchain/ts-types';
import { TYPES } from '../constants/index.js';
import { type TWithPartialFee } from '../types/index.js';
import { alias } from './alias.js';
import { burn } from './burn.js';
import { cancelLease } from './cancelLease.js';
import { data } from './data.js';
import { exchange, remapOrder } from './exchange.js';
import { invokeScript } from './invokeScript.js';
import { issue } from './issue.js';
import { lease } from './lease.js';
import { massTransfer } from './massTransfer.js';
import { reissue } from './reissue.js';
import { setAssetScript } from './setAssetScript.js';
import { setScript } from './setScript.js';
import { sponsorship } from './sponsorship.js';
import { transfer } from './transfer.js';
import { updateAssetInfo } from './updateAssetInfo.js';

export type { IClientAlias } from './alias.js';
export type { TClientBurn } from './burn.js';
export type { IClientCancelLease } from './cancelLease.js';
export type { IClientData } from './data.js';
export type { IClientExchange } from './exchange.js';
export type { IClientInvokeScript } from './invokeScript.js';
export type { IClientIssue } from './issue.js';
export type { IClientLease } from './lease.js';
export type { TClientMassTransfer } from './massTransfer.js';
export type { TClientReissue } from './reissue.js';
export type { IClientSetAssetScript } from './setAssetScript.js';
export type { IClientSetScript } from './setScript.js';
export type { IClientSponsorship } from './sponsorship.js';
export type { IClientTransfer } from './transfer.js';
export type { IClientUpdateAssetInfo } from './updateAssetInfo.js';

import { type IClientAlias } from './alias.js';
import { type TClientBurn } from './burn.js';
import { type IClientCancelLease } from './cancelLease.js';
import { type IClientData } from './data.js';
import { type IClientExchange, type IClientExchangeOrder } from './exchange.js';
import { type IClientInvokeScript } from './invokeScript.js';
import { type IClientIssue } from './issue.js';
import { type IClientLease } from './lease.js';
import { type TClientMassTransfer } from './massTransfer.js';
import { type TClientReissue } from './reissue.js';
import { type IClientSetAssetScript } from './setAssetScript.js';
import { type IClientSetScript } from './setScript.js';
import { type IClientSponsorship } from './sponsorship.js';
import { type IClientTransfer } from './transfer.js';
import { type IClientUpdateAssetInfo } from './updateAssetInfo.js';

export const node = {
  alias,
  burn,
  cancelLease,
  data,
  exchange,
  invokeScript,
  issue,
  lease,
  massTransfer,
  order: remapOrder,
  reissue,
  setAssetScript,
  setScript,
  sponsorship,
  transfer,
  updateAssetInfo,
};

function isOrder(data: TClientEntity | IClientExchangeOrder): data is IClientExchangeOrder {
  return 'orderType' in data;
}

export function toNode(
  item: IClientExchangeOrder,
): SignedIExchangeTransactionOrder<ExchangeTransactionOrder<string>>;
export function toNode<TX extends TClientEntity, TYPE extends TX['type'] = TX['type']>(
  item: TX,
): TWithPartialFee<TransactionMap<string>[TYPE]>;
export function toNode(
  item: TClientEntity | IClientExchangeOrder,
):
  | TWithPartialFee<SignableTransaction<string>>
  | SignedIExchangeTransactionOrder<ExchangeTransactionOrder<string>> {
  if (isOrder(item)) {
    return remapOrder(item);
  }

  switch (item.type) {
    case TYPES.ISSUE:
      return issue(item);
    case TYPES.TRANSFER:
      return transfer(item);
    case TYPES.REISSUE:
      return reissue(item);
    case TYPES.BURN:
      return burn(item);
    case TYPES.EXCHANGE:
      return exchange(item);
    case TYPES.LEASE:
      return lease(item);
    case TYPES.CANCEL_LEASE:
      return cancelLease(item);
    case TYPES.ALIAS:
      return alias(item);
    case TYPES.MASS_TRANSFER:
      return massTransfer(item);
    case TYPES.DATA:
      return data(item);
    case TYPES.SET_SCRIPT:
      return setScript(item);
    case TYPES.SPONSORSHIP:
      return sponsorship(item) as SponsorshipTransaction<string>;
    case TYPES.SET_ASSET_SCRIPT:
      return setAssetScript(item);
    case TYPES.INVOKE_SCRIPT:
      return invokeScript(item);
    case TYPES.UPDATE_ASSET_INFO:
      return updateAssetInfo(item);
    default:
      throw new Error('Unknown transaction type!');
  }
}

export type TClientEntity =
  | IClientAlias
  | TClientBurn
  | IClientCancelLease
  | IClientData
  | IClientExchange
  | IClientIssue
  | TClientReissue
  | IClientLease
  | TClientMassTransfer
  | IClientSetAssetScript
  | IClientSetScript
  | IClientSponsorship
  | IClientTransfer
  | IClientInvokeScript
  | IClientUpdateAssetInfo;
