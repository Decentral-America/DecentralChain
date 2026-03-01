import type {
  IExchangeTransactionOrderWithProofs,
  ISponsorshipTransaction,
  TTransaction,
  TTransactionMap,
} from '@decentralchain/ts-types';
import type { TWithPartialFee } from '../types/index.js';
import { TYPES } from '../constants/index.js';
import { isOrder } from '../utils/index.js';
import { alias } from './alias.js';
import { burn } from './burn.js';
import { cancelLease } from './cancelLease.js';
import { data } from './data.js';
import { exchange, remapOrder } from './exchange.js';
import { issue } from './issue.js';
import { reissue } from './reissue.js';
import { lease } from './lease.js';
import { massTransfer } from './massTransfer.js';
import { setAssetScript } from './setAssetScript.js';
import { setScript } from './setScript.js';
import { sponsorship } from './sponsorship.js';
import { transfer } from './transfer.js';
import { invokeScript } from './invokeScript.js';
import { updateAssetInfo } from './updateAssetInfo.js';

export type { IDCCGuiAlias } from './alias.js';
export type { TDCCGuiBurn } from './burn.js';
export type { IDCCGuiCancelLease } from './cancelLease.js';
export type { IDCCGuiData } from './data.js';
export type { IDCCGuiExchange, IDCCGuiExchangeOrder } from './exchange.js';
export type { IDCCGuiIssue } from './issue.js';
export type { TDCCGuiReissue } from './reissue.js';
export type { IDCCGuiLease } from './lease.js';
export type { TDCCGuiMassTransfer } from './massTransfer.js';
export type { IDCCGuiSetAssetScript } from './setAssetScript.js';
export type { IDCCGuiSetScript } from './setScript.js';
export type { IDCCGuiSponsorship } from './sponsorship.js';
export type { IDCCGuiTransfer } from './transfer.js';
export type { IDCCGuiInvokeScript } from './invokeScript.js';
export type { IDCCGuiUpdateAssetInfo } from './updateAssetInfo.js';

import type { IDCCGuiAlias } from './alias.js';
import type { TDCCGuiBurn } from './burn.js';
import type { IDCCGuiCancelLease } from './cancelLease.js';
import type { IDCCGuiData } from './data.js';
import type { IDCCGuiExchange, IDCCGuiExchangeOrder } from './exchange.js';
import type { IDCCGuiIssue } from './issue.js';
import type { TDCCGuiReissue } from './reissue.js';
import type { IDCCGuiLease } from './lease.js';
import type { TDCCGuiMassTransfer } from './massTransfer.js';
import type { IDCCGuiSetAssetScript } from './setAssetScript.js';
import type { IDCCGuiSetScript } from './setScript.js';
import type { IDCCGuiSponsorship } from './sponsorship.js';
import type { IDCCGuiTransfer } from './transfer.js';
import type { IDCCGuiInvokeScript } from './invokeScript.js';
import type { IDCCGuiUpdateAssetInfo } from './updateAssetInfo.js';

export const node = {
  alias,
  burn,
  cancelLease,
  data,
  exchange,
  issue,
  reissue,
  lease,
  massTransfer,
  setAssetScript,
  setScript,
  sponsorship,
  transfer,
  order: remapOrder,
  invokeScript,
  updateAssetInfo,
};

export function toNode(item: IDCCGuiExchangeOrder): IExchangeTransactionOrderWithProofs<string>;
export function toNode<TX extends TDCCGuiEntity, TYPE extends TX['type'] = TX['type']>(
  item: TX,
): TWithPartialFee<TTransactionMap<string>[TYPE]>;
export function toNode(
  item: TDCCGuiEntity | IDCCGuiExchangeOrder,
): TWithPartialFee<TTransaction<string>> | IExchangeTransactionOrderWithProofs<string> {
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
      return sponsorship(item) as ISponsorshipTransaction<string>;
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

export type TDCCGuiEntity =
  | IDCCGuiAlias
  | TDCCGuiBurn
  | IDCCGuiCancelLease
  | IDCCGuiData
  | IDCCGuiExchange
  | IDCCGuiIssue
  | TDCCGuiReissue
  | IDCCGuiLease
  | TDCCGuiMassTransfer
  | IDCCGuiSetAssetScript
  | IDCCGuiSetScript
  | IDCCGuiSponsorship
  | IDCCGuiTransfer
  | IDCCGuiInvokeScript
  | IDCCGuiUpdateAssetInfo;
