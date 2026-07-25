import { type TLong } from '../../interface';
import {
  assertValidGenerationPeriodLength,
  generationPeriodFrom,
  generationPeriodNext,
  type IGenerationPeriodBounds,
  toGenerationPeriodBounds,
} from '../../tools/finality/generationPeriod';
import request from '../../tools/request';
import { fetchFeatureActivationHeight } from '../activation';
import { fetchHeight, type IBlockHeader } from '../blocks';

// NOTE: deliberately NOT re-exported from this module. `create()` (see
// `src/create.ts`) wraps every export of an `api-node/*` module assuming it's
// a `(base: string, ...) => Promise<...>` HTTP call and auto-binds `base` —
// these are plain pure functions `(height, ...) => ...`, so re-exporting them
// here breaks that wrapping (`wrapRecord`/`TWrapApi`). Import them directly
// from `tools/finality/generationPeriod` instead.

/**
 * GET /blocks/headers/finalized
 * Last finalized block header
 * @param base
 * @param options
 */
export function fetchFinalized(base: string, options: RequestInit = {}): Promise<IBlockHeader> {
  return request({
    base,
    options,
    url: '/blocks/headers/finalized',
  });
}

/**
 * GET last finalized block height
 * @param base
 * @param options
 */
export function fetchFinalizedHeight(
  base: string,
  options: RequestInit = {},
): Promise<{ height: number }> {
  return request({
    base,
    options,
    url: '/blocks/height/finalized',
  });
}

/**
 * GET finalized block height at
 * @param base
 * @param height
 * @param options
 */
export function fetchFinalizedHeightAt(
  base: string,
  height: number,
  options: RequestInit = {},
): Promise<{ height: number }> {
  return request({
    base,
    options,
    url: `/blocks/finalized/at/${height}`,
  });
}

/**
 * GET /generators/at/{height}
 * Committed generators list at height
 * @param base
 * @param height
 * @param options
 */
export function fetchCommittedGeneratorsAt(
  base: string,
  height: number,
  options: RequestInit = {},
): Promise<Array<ICommittedGenerator>> {
  return request({
    base,
    options,
    url: `/generators/at/${height}`,
  });
}

/**
 * Get committed generator index for provided address.
 * Returns index from 0, or -1 when address is missing in the list.
 * @param base
 * @param height
 * @param address
 * @param options
 */
export function fetchCommittedGeneratorIndex(
  base: string,
  height: number,
  address: string,
  options: RequestInit = {},
): Promise<number> {
  return fetchCommittedGeneratorsAt(base, height, options).then((list) => {
    const index = list.findIndex((item) => item.address === address);
    return index >= 0 ? index : -1;
  });
}

/**
 * node-scala `BlockchainFeature.DeterministicFinality` id (see node-scala
 * `node/src/main/scala/com/decentralchain/features/BlockchainFeature.scala:31`:
 * `val DeterministicFinality = BlockchainFeature(25, "Deterministic Finality & RIDE V9")`).
 *
 * Generation periods (and therefore `currentGenerationPeriod`/`nextGenerationPeriod`
 * below) are only meaningful once this feature is activated on the chain.
 *
 * NOT exported: `create()` (`src/create.ts`) wraps every runtime export of an
 * `api-node/*` module as an HTTP call `(base: string, ...) => Promise<...>`
 * and auto-binds `base` (see `wrapRecord`/`TWrapApi`) — a plain numeric
 * constant breaks that contract. Kept module-private; re-derive `25` from
 * node-scala's `BlockchainFeature.scala` if you need it elsewhere.
 */
const DETERMINISTIC_FINALITY_FEATURE_ID = 25;

/**
 * Composes finality info from real, existing node-scala endpoints — there is
 * no `GET /blockchain/finality` route in node-scala (confirmed: no
 * `FinalityApiRoute`/`BlockchainApiRoute` class, no `pathPrefix("blockchain")`
 * anywhere in the codebase). This function fetches the pieces individually and
 * derives the rest client-side:
 *  - `height` ← `GET /blocks/height` ({@link fetchHeight})
 *  - `finalizedHeight` ← `GET /blocks/height/finalized` ({@link fetchFinalizedHeight})
 *  - `currentGenerators` ← `GET /generators/at/{height}` at the current height
 *    ({@link fetchCommittedGeneratorsAt})
 *  - `currentGenerationPeriod` / `nextGenerationPeriod` ← computed locally via
 *    {@link generationPeriodFrom} / {@link generationPeriodNext}, using the
 *    Deterministic Finality activation height from `GET /activation/status`
 *    ({@link fetchFeatureActivationHeight}) and the `generationPeriodLength`
 *    parameter below. Omitted (`undefined`) if the feature isn't activated yet.
 *
 * Two known gaps, both blocked on separate node-scala server-side work:
 *
 * 1. `generationPeriodLength` is a deployment-specific constant (mainnet:
 *    10_000, this network's testnet: 3000, see node-scala
 *    `BlockchainSettings.scala:85,152,172,190`) and is **not yet queryable**
 *    from any node-scala endpoint. Until a node-scala change exposes it (e.g.
 *    on `/activation/status` or a new settings route — tracked separately),
 *    callers must supply it themselves (e.g. from their own network config).
 *    This function does NOT guess a default — passing the wrong value would
 *    silently produce wrong period boundaries, which is worse than requiring
 *    the caller to be explicit.
 * 2. `nextGenerators` is always `null`: see the JSDoc on
 *    {@link IFinalityInfo.nextGenerators}.
 *
 * @param base
 * @param generationPeriodLength Deployment-specific; see gap (1) above. Must be a positive integer.
 * @param options
 */
export async function fetchFinalityInfo(
  base: string,
  generationPeriodLength: number,
  options: RequestInit = {},
): Promise<IFinalityInfo> {
  // Fail fast on a bad value, independent of whether the feature turns out to
  // be activated (and thus whether a period would actually be computed).
  assertValidGenerationPeriodLength(generationPeriodLength);

  const [{ height }, { height: finalizedHeight }, activationHeight] = await Promise.all([
    fetchHeight(base),
    fetchFinalizedHeight(base, options),
    fetchFeatureActivationHeight(base, DETERMINISTIC_FINALITY_FEATURE_ID, options),
  ]);

  const currentGenerators = await fetchCommittedGeneratorsAt(base, height, options);

  let currentGenerationPeriod: IGenerationPeriod | undefined;
  let nextGenerationPeriod: IGenerationPeriod | undefined;

  if (activationHeight !== undefined) {
    const currentPeriod = generationPeriodFrom(height, activationHeight, generationPeriodLength);
    if (currentPeriod) {
      currentGenerationPeriod = toGenerationPeriodBounds(currentPeriod);
      nextGenerationPeriod = toGenerationPeriodBounds(generationPeriodNext(currentPeriod));
    }
  }

  return {
    currentGenerators,
    finalizedHeight,
    height,
    // Omitted entirely (rather than set to `undefined`) when the feature isn't
    // activated yet, to satisfy `exactOptionalPropertyTypes`.
    ...(currentGenerationPeriod && { currentGenerationPeriod }),
    ...(nextGenerationPeriod && { nextGenerationPeriod }),
    // See IFinalityInfo.nextGenerators JSDoc: not fetchable from the current node API.
    nextGenerators: null,
  };
}

/**
 * Height range `[start, end]` covered by a generation period. Re-exported
 * from `tools/finality/generationPeriod` under its historical name.
 */
export type IGenerationPeriod = IGenerationPeriodBounds;

export interface IFinalityInfo {
  height: number;
  finalizedHeight: number;
  currentGenerationPeriod?: IGenerationPeriod;
  currentGenerators: ICommittedGenerator[];
  nextGenerationPeriod?: IGenerationPeriod;
  /**
   * Committed generators for the *next* generation period.
   *
   * Always `null` today. Fetching this would require calling
   * `GET /generators/at/{height}` with `height` set to the next period's
   * start height — but node-scala's `GeneratorsApiRoute.scala:16` hard-rejects
   * any height greater than the current chain height:
   * `if (height > blockchain.height) complete(StatusCodes.NotFound, Json.arr())`.
   * The next period's start height is, by construction, always beyond the
   * current chain height, so this route can never serve it as-is.
   *
   * This is blocked on separate node-scala server-side work (tracked
   * separately, not yet implemented) to add a route that can answer "who
   * will generate/commit for a future period" without violating that guard.
   *
   * `null` here means "not obtainable from the current node API" — a
   * distinct meaning from `[]`, which would mean "queried successfully, the
   * list happens to be empty".
   */
  nextGenerators: INextCommittedGenerator[] | null;
}

export interface ICommittedGenerator {
  address: string;
  balance: TLong;
  transactionId: string;
  conflictHeight?: number;
}

export interface INextCommittedGenerator {
  address: string;
  transactionId: string;
}
