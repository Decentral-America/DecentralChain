import {
  type ExchangeTransactionOrder,
  type SignableTransaction,
  type SignedIExchangeTransactionOrder,
  type SponsorshipTransaction,
  type TransactionMap,
} from '@decentralchain/ts-types';
import { TYPES } from '../constants/index.js';
import { type TWithPartialFee } from '../types/index.js';
import { alias, type IClientAlias } from './alias.js';
import { burn, type TClientBurn } from './burn.js';
import { cancelLease, type IClientCancelLease } from './cancelLease.js';
import { data, type IClientData } from './data.js';
import {
  exchange,
  type IClientExchange,
  type IClientExchangeOrder,
  remapOrder,
} from './exchange.js';
import { type IClientInvokeScript, invokeScript } from './invokeScript.js';
import { type IClientIssue, issue } from './issue.js';
import { type IClientLease, lease } from './lease.js';
import { massTransfer, type TClientMassTransfer } from './massTransfer.js';
import { reissue, type TClientReissue } from './reissue.js';
import { type IClientSetAssetScript, setAssetScript } from './setAssetScript.js';
import { type IClientSetScript, setScript } from './setScript.js';
import { type IClientSponsorship, sponsorship } from './sponsorship.js';
import { type IClientTransfer, transfer } from './transfer.js';
import { type IClientUpdateAssetInfo, updateAssetInfo } from './updateAssetInfo.js';

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
