import {
  type AssetDecimals,
  type DataTransactionEntry,
  type Transaction,
  type WithId,
} from '@decentralchain/ts-types';
import { type TLong } from '../../interface';
import query from '../../tools/query';
import request from '../../tools/request';
import { pathSegment } from '../../tools/utils';

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

/**
 * POST /debug/blacklist
 * Add a peer to the ban list.
 */
export function postPeerToTheBanList(base: string, peer: string): Promise<unknown> {
  return request({
    base,
    url: '/debug/blacklist',
    options: {
      method: 'POST',
      body: peer,
      headers: { 'Content-Type': 'application/json' },
    },
  });
}

/**
 * GET /debug/stateHash/{height}
 * State hash at a given height.
 * Requires `waves.db.store-state-hashes = true` in node configuration.
 */
export function debugStateHash(
  base: string,
  height: number,
  options: RequestInit = {},
): Promise<IStateHash> {
  return request({
    base,
    url: `/debug/stateHash/${pathSegment(height)}`,
    options,
  });
}

/**
 * POST /debug/validate
 * Validate a transaction and measure time spent (ms).
 * Pass the JSON transaction with proofs.
 */
export function debugValidate(base: string, transaction: string): Promise<IValidateResponse> {
  return request({
    base,
    url: '/debug/validate',
    options: {
      method: 'POST',
      body: transaction,
      headers: { 'Content-Type': 'application/json' },
    },
  });
}

// ── API-key-protected endpoints ──────────────────────────────────────

/**
 * GET /debug/configInfo
 * Node configuration info. Requires node API key.
 */
export function fetchConfigInfo(base: string, apiKey: string): Promise<string> {
  return request({
    base,
    url: '/debug/configInfo',
    options: {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    },
  });
}

/**
 * GET /debug/info
 * Node debug information. Requires node API key.
 */
export function fetchDebugInfo(base: string, apiKey: string): Promise<IDebugInfo> {
  return request({
    base,
    url: '/debug/info',
    options: {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    },
  });
}

/**
 * GET /debug/minerInfo
 * Miner information. Requires node API key.
 */
export function fetchMinerInfo(base: string, apiKey: string): Promise<IMinerInfo<TLong>> {
  return request({
    base,
    url: '/debug/minerInfo',
    options: {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    },
  });
}

/**
 * GET /debug/portfolios/{address}
 * Portfolio for address. Requires node API key.
 */
export function fetchPortfolios(
  base: string,
  address: string,
  apiKey: string,
): Promise<IPortfolio<TLong>> {
  return request({
    base,
    url: `/debug/portfolios/${pathSegment(address)}`,
    options: {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    },
  });
}

/**
 * POST /debug/print
 * Print a message to the node log. Requires node API key.
 */
export function debugPrint(base: string, message: string, apiKey: string): Promise<unknown> {
  return request({
    base,
    url: '/debug/print',
    options: {
      method: 'POST',
      body: JSON.stringify({ message }),
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    },
  });
}

/**
 * POST /debug/rollback
 * Remove all blocks after a given height.
 * Max rollback depth is set by `waves.db.max-rollback-depth` (default 2000).
 * Requires node API key.
 */
export function debugRollback(
  base: string,
  height: number,
  returnTransactionsToUtx: boolean,
  apiKey: string,
): Promise<unknown> {
  return request({
    base,
    url: '/debug/rollback',
    options: {
      method: 'POST',
      body: JSON.stringify({ rollbackTo: height, returnTransactionsToUtx }),
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    },
  });
}

/**
 * DELETE /debug/rollback-to/{id}
 * Rollback state to the block with a given ID. Requires node API key.
 */
export function debugRollbackTo(base: string, id: string, apiKey: string): Promise<unknown> {
  return request({
    base,
    url: `/debug/rollback-to/${pathSegment(id)}`,
    options: {
      method: 'DELETE',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    },
  });
}

/**
 * GET /debug/state
 * Regular address balance at the current height. Requires node API key.
 */
export function debugState(base: string, apiKey: string): Promise<Record<string, number | string>> {
  return request({
    base,
    url: '/debug/state',
    options: {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    },
  });
}

/**
 * GET /debug/stateDcc/{height}
 * Regular address balance at a given height. Requires node API key.
 */
export function debugStateDcc(
  base: string,
  height: number,
  apiKey: string,
): Promise<Record<string, number | string>> {
  return request({
    base,
    url: `/debug/stateDcc/${pathSegment(height)}`,
    options: {
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
    },
  });
}

interface IDebugInfo {
  stateHeight: number;
  extensionLoaderState: string;
  historyReplierCacheSizes: {
    microBlockOwners: number;
    nextInvs: number;
    awaiting: number;
    successfullyReceived: number;
  };
  microBlockSynchronizerCacheSizes: {
    microBlockOwners: number;
    nextInvs: number;
    awaiting: number;
    successfullyReceived: number;
  };
  scoreObserverStats: {
    localScore: number;
    currentBestChannel: string;
    scoresCacheSize: number;
  };
  minerState: string;
}

interface IMinerInfo<LONG> {
  address: string;
  miningBalance: LONG;
  timestamp: number;
}

interface IPortfolio<LONG> {
  balance: number;
  lease: {
    in: number;
    out: number;
  };
  assets: Record<string, LONG>;
}

interface IStateHash {
  stateHash: string;
  dccBalanceHash: string;
  assetBalanceHash: string;
  dataEntryHash: string;
  accountScriptHash: string;
  assetScriptHash: string;
  leaseBalanceHash: string;
  leaseStatusHash: string;
  sponsorshipHash: string;
  aliasHash: string;
  blockId: string;
}

interface IValidateResponse {
  valid: boolean;
  validationTime: number;
  trace: string[];
}
