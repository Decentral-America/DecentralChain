import { type Transaction, type WithId } from '@decentralchain/types';
import { type TLong } from '../../interface';
import request from '../../tools/request';
// TPayment/TStateChanges/IWithStateChanges now live in tools/transactions/transactions.ts (see
// the NOTE there) to avoid an import cycle: this module calls into `../transactions`, which
// depends on that file. Re-exported here for backward compatibility — they used to be defined
// in this module.
import {
  type IWithStateChanges,
  type TPayment,
  type TStateChanges,
} from '../../tools/transactions/transactions';
import { pathSegment } from '../../tools/utils';
import { fetchHeightById } from '../blocks';
import { fetchInfo, fetchTransactions } from '../transactions';

export type { IWithStateChanges, TPayment, TStateChanges };

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
    options,
    url: `/debug/balances/history/${pathSegment(address)}`,
  });
}

interface IBalanceHistory {
  height: number;
  balance: TLong;
}

/**
 * Get list of transactions with state changes where specified address has been involved
 *
 * @deprecated `GET /debug/stateChanges/address/{address}/limit/{limit}` was removed by
 * node-scala's `NODE-2496 Remove deprecated API routes (#3876)` (commit `c82177af69`). The
 * state-changes data was folded into the regular transactions-by-address response instead
 * (node-scala's `NODE-2265: Insert stateChanges in transactions routes responses (#3313)`), so
 * this now proxies to the real, current `GET /transactions/address/{address}/limit/{limit}`
 * route via {@link fetchTransactions}. Prefer calling {@link fetchTransactions} directly —
 * it is the same request without the indirection.
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
  return fetchTransactions(base, address, limit, after, undefined, options) as unknown as Promise<
    (Transaction<TLong> & WithId & IWithStateChanges)[]
  >;
}

/**
 * Get invokeScript transaction state changes
 *
 * @deprecated `GET /debug/stateChanges/info/{txId}` was removed by node-scala's
 * `NODE-2496 Remove deprecated API routes (#3876)` (commit `c82177af69`) — it had already been
 * redirecting (301) to `/transactions/info/{id}` before that commit deleted it outright. This
 * now proxies to the real, current `GET /transactions/info/{id}` route via {@link fetchInfo}.
 * Prefer calling {@link fetchInfo} directly — it is the same request without the indirection.
 * @param base
 * @param txId
 */
export function fetchStateChangesByTxId(
  base: string,
  txId: string,
  options: RequestInit = {},
): Promise<Transaction<TLong> & WithId & IWithStateChanges> {
  return fetchInfo(base, txId, options) as unknown as Promise<
    Transaction<TLong> & WithId & IWithStateChanges
  >;
}

/**
 * POST /debug/blacklist
 * Add a peer to the ban list.
 */
export function postPeerToTheBanList(base: string, peer: string): Promise<unknown> {
  return request({
    base,
    options: {
      body: peer,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
    url: '/debug/blacklist',
  });
}

/**
 * GET /debug/stateHash/{height}
 * State hash at a given height.
 * Requires `db.store-state-hashes = true` in node configuration.
 */
export function debugStateHash(
  base: string,
  height: number,
  options: RequestInit = {},
): Promise<IStateHash> {
  return request({
    base,
    options,
    url: `/debug/stateHash/${pathSegment(height)}`,
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
    options: {
      body: transaction,
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
    url: '/debug/validate',
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
    options: {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    },
    url: '/debug/configInfo',
  });
}

/**
 * GET /debug/info
 * Node debug information. Requires node API key.
 */
export function fetchDebugInfo(base: string, apiKey: string): Promise<IDebugInfo> {
  return request({
    base,
    options: {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    },
    url: '/debug/info',
  });
}

/**
 * GET /debug/minerInfo
 * Miner information. Requires node API key.
 */
export function fetchMinerInfo(base: string, apiKey: string): Promise<IMinerInfo<TLong>> {
  return request({
    base,
    options: {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    },
    url: '/debug/minerInfo',
  });
}

/**
 * @deprecated `GET /debug/portfolios/{address}` was removed by node-scala's
 * `NODE-2496 Remove deprecated API routes (#3876)` (commit `c82177af69`) with no replacement —
 * the current `DebugApiRoute.scala` no longer exposes a per-address asset-portfolio breakdown
 * under any route. `GET /addresses/balance/details/{address}` (see `fetchBalanceDetails`) covers
 * DCC balance/lease/generating figures but does not return the `assets` map this endpoint used
 * to return. This function no longer works against any real node and now throws instead of
 * making a request that would 404.
 */
export function fetchPortfolios(
  _base: string,
  address: string,
  _apiKey: string,
): Promise<IPortfolio<TLong>> {
  return Promise.reject(
    new Error(
      `fetchPortfolios: removed server-side in node-scala commit c82177af69 ` +
        `("NODE-2496 Remove deprecated API routes (#3876)"), no replacement — ` +
        `GET /debug/portfolios/${address} no longer exists on any real node.`,
    ),
  );
}

/**
 * POST /debug/print
 * Print a message to the node log. Requires node API key.
 */
export function debugPrint(base: string, message: string, apiKey: string): Promise<unknown> {
  return request({
    base,
    options: {
      body: JSON.stringify({ message }),
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      method: 'POST',
    },
    url: '/debug/print',
  });
}

/**
 * POST /debug/rollback
 * Remove all blocks after a given height.
 * Max rollback depth is set by `db.max-rollback-depth` in node config (default 2000).
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
    options: {
      body: JSON.stringify({ returnTransactionsToUtx, rollbackTo: height }),
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
      method: 'POST',
    },
    url: '/debug/rollback',
  });
}

/**
 * Rollback state to the block with a given ID. Requires node API key.
 *
 * @deprecated `DELETE /debug/rollback-to/{id}` was removed by node-scala's
 * `NODE-2496 Remove deprecated API routes (#3876)` (commit `c82177af69`) in favor of the
 * pre-existing `POST /debug/rollback` route, which takes a **height** (not a block ID) in its
 * request body — see `RollbackParams(rollbackTo: Int, returnTransactionsToUtx: Boolean)` in
 * node-scala's current `RollbackParams.scala`. To preserve this function's by-ID contract
 * without breaking callers, it now resolves the ID to a height via the real
 * `GET /blocks/height/{id}` route and forwards to {@link debugRollback}. If you already have a
 * height, call {@link debugRollback} directly instead — it is the same request without the
 * extra lookup round-trip.
 */
export async function debugRollbackTo(base: string, id: string, apiKey: string): Promise<unknown> {
  const { height } = await fetchHeightById(base, id);
  return debugRollback(base, height, false, apiKey);
}

/**
 * GET /debug/state
 * Regular address balance at the current height. Requires node API key.
 */
export function debugState(base: string, apiKey: string): Promise<Record<string, number | string>> {
  return request({
    base,
    options: {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    },
    url: '/debug/state',
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
    options: {
      headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    },
    url: `/debug/stateDcc/${pathSegment(height)}`,
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
