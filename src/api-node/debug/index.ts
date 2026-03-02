import request from '../../tools/request';
import { type TLong } from '../../interface';
import query from '../../tools/query';
import { pathSegment } from '../../tools/utils';
import {
  type AssetDecimals,
  type DataTransactionEntry,
  type Transaction,
  type WithId,
} from '@decentralchain/ts-types';

/**
 * DecentralChain balance history
 * @param base
 * @param address
 */
export function fetchBalanceHistory(
  base: string,
  address: string,
  options: RequestInit = {},
): Promise<IBalanceHistory[]> {
  return request({
    base,
    url: `/debug/balances/history/${pathSegment(address)}`,
    options,
  });
}

interface IBalanceHistory {
  height: number;
  balance: TLong;
}

export interface TPayment {
  assetId: string | null;
  amount: TLong;
}

export interface TStateChanges {
  data: DataTransactionEntry[];
  transfers: {
    address: string;
    amount: TLong;
    asset: string | null;
  }[];
  issues: {
    assetId: string;
    name: string;
    description: string;
    quantity: TLong;
    decimals: AssetDecimals;
    isReissuable: boolean;
    compiledScript: null | string;
    nonce: TLong;
  }[];
  reissues: {
    assetId: string;
    isReissuable: boolean;
    quantity: TLong;
  }[];
  burns: {
    assetId: string;
    quantity: TLong;
  }[];
  sponsorFees: {
    assetId: string;
    minSponsoredAssetFee: TLong;
  }[];
  leases: {
    leaseId: string;
    recipient: string;
    amount: TLong;
  }[];
  leaseCancels: { leaseId: string }[];
  invokes: {
    dApp: string;
    call: {
      function: string;
      args: { type: string; value: string }[];
    };
    payment: TPayment[];
    stateChanges: TStateChanges;
  }[];
  error?: {
    code: number;
    text: string;
  };
}

export interface IWithStateChanges {
  stateChanges: TStateChanges;
}

/**
 * Get list of transactions with state changes where specified address has been involved
 * @param base
 * @param address
 * @param limit
 * @param after
 */
export function fetchStateChangesByAddress(
  base: string,
  address: string,
  limit: number,
  after?: string,
  options: RequestInit = {},
): Promise<(Transaction<TLong> & WithId & IWithStateChanges)[]> {
  return request({
    base,
    url: `/debug/stateChanges/address/${pathSegment(address)}/limit/${pathSegment(limit)}${query({ after })}`,
    options,
  });
}

/**
 * Get invokeScript transaction state changes
 * @param base
 * @param txId
 */
export function fetchStateChangesByTxId(
  base: string,
  txId: string,
  options: RequestInit = {},
): Promise<Transaction<TLong> & WithId & IWithStateChanges> {
  return request({
    base,
    url: `/debug/stateChanges/info/${pathSegment(txId)}`,
    options,
  });
}

// @TODO need API key:
// GET /debug/stateDcc/{height}
// POST /debug/rollback
// DELETE /debug/rollback-to/{id}
// GET /debug/portfolios/{address}
// GET /debug/minerInfo
// GET /debug/historyInfo
// GET /debug/historyInfo
// GET /debug/info
// POST /debug/validate
// GET /debug/blocks/{howMany}
// POST /debug/blacklist
// POST /debug/print
// GET /debug/state
