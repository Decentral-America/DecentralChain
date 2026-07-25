import { type TLong } from '../../interface';
import { fetchBalanceDetails } from '../addresses';
import { fetchHeadersLast } from '../blocks';

/**
 * Generating balance
 *
 * @deprecated `GET /consensus/generatingbalance/{address}` was removed along with the entire
 * `/consensus` REST API by node-scala's `Remove /consensus route (REST API) (#3557)` (commit
 * `d0388ebdaa`). The same figure is exposed as the `generating` field of
 * `GET /addresses/balance/details/{address}` (confirmed by that commit's own updated
 * integration test, which replaced `generatingBalance(address).balance` with
 * `balanceDetails(address).generating`). This now proxies to the real, current
 * `fetchBalanceDetails`. Prefer calling {@link fetchBalanceDetails} directly if you also need
 * the other balance fields it returns.
 * @param base
 * @param address
 */
export async function fetchGeneratingBalance(
  base: string,
  address: string,
  options: RequestInit = {},
): Promise<IGeneratingBalance<TLong>> {
  const details = await fetchBalanceDetails(base, address, options);
  return { address, balance: details.generating };
}

/**
 * Base target last
 *
 * @deprecated `GET /consensus/basetarget` was removed along with the entire `/consensus` REST
 * API by node-scala's `Remove /consensus route (REST API) (#3557)` (commit `d0388ebdaa`), with
 * no dedicated replacement route. The base-target value is still present on every block header
 * (`['nxt-consensus']['base-target']`) via `GET /blocks/headers/last`, so this now proxies to the
 * real, current {@link fetchHeadersLast}. Prefer calling {@link fetchHeadersLast} directly if
 * you also need the rest of the block header.
 * @param base
 */
export async function fetchBasetarget(base: string): Promise<IBasetarget> {
  const header = await fetchHeadersLast(base);
  return { baseTarget: header['nxt-consensus']['base-target'] };
}

/**
 * Consensus algo
 *
 * @deprecated `GET /consensus/algo` was removed along with the entire `/consensus` REST API by
 * node-scala's `Remove /consensus route (REST API) (#3557)` (commit `d0388ebdaa`), with no
 * replacement anywhere in the current API. It returned a hardcoded legacy NXT-era label
 * ("Fair Proof-of-Stake (FairPoS)" vs "proof-of-stake (PoS)") that predates DCC's current
 * PoS/finality model (see `DeterministicFinality`) and has no current equivalent. This function
 * no longer works against any real node and now throws instead of making a request that would
 * 404.
 * @param base
 */
export function fetchConsensusAlgo(_base: string): Promise<IConsensusAlgo> {
  return Promise.reject(
    new Error(
      `fetchConsensusAlgo: removed server-side in node-scala commit d0388ebdaa ` +
        `("Remove /consensus route (REST API) (#3557)"), no replacement — ` +
        `GET /consensus/algo no longer exists on any real node.`,
    ),
  );
}

export interface IGeneratingBalance<LONG> {
  address: string;
  balance: LONG;
}

export interface IBasetarget {
  baseTarget: number;
}

export interface IConsensusAlgo {
  consensusAlgo: string;
}

export interface IGeneraationSignatureBlockId {
  generationSignature: string;
}

export interface IBaseTargetBlockId {
  baseTarget: number;
}

export interface IGenerationSignature {
  generationSignature: string;
}
