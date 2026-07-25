/**
 * Pure port of node-scala's `GenerationPeriod` logic
 * (`node/src/main/scala/com/decentralchain/state/GenerationPeriod.scala`).
 *
 * No network calls here — this is why it lives under `tools/` rather than
 * `api-node/finality/`: it mirrors the split already used elsewhere in this
 * package (e.g. `tools/adresses/getAssetIdListByTx.ts`) between pure/composable
 * helpers (unit-tested directly) and thin HTTP endpoint wrappers
 * (`api-node/**`, integration-tested against a live node).
 */

export interface IGenerationPeriodBounds {
  start: number;
  end: number;
}

/**
 * Faithful port of node-scala's `GenerationPeriod` case class
 * (`GenerationPeriod.scala:7-35`), kept as a plain data shape rather than a
 * class to match this package's functional style.
 */
export interface IGenerationPeriodState {
  /** Height at which the owning feature was activated. */
  activation: number;
  /** Height at which this period starts. */
  start: number;
  /** `generationPeriodLength` for the network (deployment-specific — see `fetchFinalityInfo`). */
  length: number;
}

/**
 * Port of `GenerationPeriod.end` (`GenerationPeriod.scala:10-13`):
 * ```scala
 * def end: Height = {
 *   val offset = if (isZero) 0 else -1
 *   start + length + offset
 * }
 * ```
 * The very first period after activation (`start === activation`, the "zero
 * period") is inclusive of one extra block compared to every later period.
 */
export function generationPeriodEnd(period: IGenerationPeriodState): number {
  const isZero = period.activation === period.start;
  const offset = isZero ? 0 : -1;
  return period.start + period.length + offset;
}

/**
 * Port of `GenerationPeriod.next` (`GenerationPeriod.scala:15`):
 * ```scala
 * def next: GenerationPeriod = move(end + 1)
 * ```
 */
export function generationPeriodNext(period: IGenerationPeriodState): IGenerationPeriodState {
  return {
    activation: period.activation,
    length: period.length,
    start: generationPeriodEnd(period) + 1,
  };
}

/**
 * Validates a `generationPeriodLength` value. Exported so callers (e.g.
 * `fetchFinalityInfo`) can fail fast on a bad value up front, rather than
 * only once/if a generation period actually needs to be computed.
 * @throws if `generationPeriodLength` is not a positive integer.
 */
export function assertValidGenerationPeriodLength(generationPeriodLength: number): void {
  if (!Number.isInteger(generationPeriodLength) || generationPeriodLength <= 0) {
    throw new Error(
      `generationPeriodLength must be a positive integer, got ${generationPeriodLength}`,
    );
  }
}

/**
 * Port of `GenerationPeriod.from` (`GenerationPeriod.scala:45-55`):
 * ```scala
 * def from(h: Height, activation: Height, generationPeriodLength: Int): Option[GenerationPeriod] =
 *   if (h < activation) none
 *   else {
 *     val blockAfterActivation = h - activation
 *     val periodIndex          = (blockAfterActivation.toInt - 1) / generationPeriodLength
 *     GenerationPeriod(
 *       activation,
 *       if (periodIndex == 0) activation else activation + periodIndex * generationPeriodLength + 1,
 *       generationPeriodLength
 *     ).some
 *   }
 * ```
 *
 * IMPORTANT: `periodIndex` uses Scala's `Int` division, which truncates
 * *toward zero*, not floor division. The only place this matters is
 * `h === activation` (the sole case where `blockAfterActivation - 1` is
 * negative, namely `-1`): `Math.floor(-1 / length)` would wrongly yield `-1`
 * for any `length > 1` (e.g. `Math.floor(-1 / 1000) === -1`), which would then
 * take the `periodIndex !== 0` branch and compute the wrong start height. This
 * port uses `Math.trunc` to match Scala's truncating-toward-zero behavior
 * exactly (`Math.trunc(-1 / 1000) === 0`, taking the correct `periodIndex === 0`
 * branch).
 *
 * Returns `null` when `height` is below the activation height (mirrors
 * Scala's `None`).
 *
 * @throws if `generationPeriodLength` is not a positive integer.
 */
export function generationPeriodFrom(
  height: number,
  activation: number,
  generationPeriodLength: number,
): IGenerationPeriodState | null {
  assertValidGenerationPeriodLength(generationPeriodLength);
  if (height < activation) return null;

  const blockAfterActivation = height - activation;
  const periodIndex = Math.trunc((blockAfterActivation - 1) / generationPeriodLength);
  const start =
    periodIndex === 0 ? activation : activation + periodIndex * generationPeriodLength + 1;

  return { activation, length: generationPeriodLength, start };
}

/** Projects a {@link IGenerationPeriodState} to the public `{ start, end }` shape. */
export function toGenerationPeriodBounds(period: IGenerationPeriodState): IGenerationPeriodBounds {
  return { end: generationPeriodEnd(period), start: period.start };
}
