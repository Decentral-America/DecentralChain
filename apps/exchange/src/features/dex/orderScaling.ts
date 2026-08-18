/**
 * Conversion between human-readable token values and the integer "coin" values
 * the matcher signs.
 *
 * The order forms previously multiplied both amount and price by a literal
 * 100000000, which assumes every asset has 8 decimals. Assets on this chain do
 * not: the live markets use 0, 1, 2, 3, 4, 5, 7 and 8. Ordering 1 unit of a
 * 0-decimal asset therefore signed an order for 100,000,000 units.
 *
 * The scaling implemented here matches `OrderPrice` in
 * @decentralchain/data-entities, which is the reference for this chain:
 *
 *   amountCoins = tokens × 10^amountDecimals
 *   priceCoins  = tokens × 10^(8 + priceDecimals − amountDecimals)
 *
 * `AssetPair.precisionDifference` is `priceAsset.precision − amountAsset.precision`,
 * and `OrderPrice._getMatcherDivider` is `10^precisionDifference × 10^8` — the
 * same exponent spelled out. The hardcoded 10^8 is only correct when both
 * assets happen to have 8 decimals, which is why the one market with resting
 * orders (CR Coin/DCC, 8/8) never exposed the bug.
 *
 * BigNumber rather than float arithmetic throughout: `0.07 * 10 ** 8` is
 * 7000000.000000001 in IEEE-754, and rounding that into a signed order is not
 * a risk worth taking on a money path.
 */
import { BigNumber } from 'bignumber.js';

/** The matcher's fixed price scale, independent of either asset's decimals. */
export const MATCHER_PRICE_SCALE = 8;

/** Decimals for the native DCC token. */
export const DCC_DECIMALS = 8;

/**
 * Parse user input into a BigNumber, or null if it is not a usable value.
 *
 * bignumber.js throws on unparseable input rather than yielding NaN, and these
 * values come straight from text fields, so construction is guarded.
 */
function parse(value: string | number): BigNumber | null {
  try {
    const parsed = new BigNumber(value);
    return parsed.isFinite() ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Convert a token amount to the integer coin value the matcher expects.
 *
 * @param tokens - Human-readable amount, e.g. "1.5".
 * @param amountDecimals - Decimals of the amount asset.
 * @returns Integer coins as a string, or null if the input is not a finite number.
 */
export function toAmountCoins(tokens: string | number, amountDecimals: number): string | null {
  const value = parse(tokens);
  if (!value || value.isNegative()) return null;
  return value.times(new BigNumber(10).pow(amountDecimals)).toFixed(0);
}

/**
 * Convert a token price to the integer coin value the matcher expects.
 *
 * The exponent depends on *both* assets, which is what the previous hardcoded
 * 10^8 got wrong for any pair whose decimals differ.
 *
 * @param tokens - Human-readable price, e.g. "0.5".
 * @param amountDecimals - Decimals of the amount asset.
 * @param priceDecimals - Decimals of the price asset.
 * @returns Integer coins as a string, or null if the input is not a finite number.
 */
export function toPriceCoins(
  tokens: string | number,
  amountDecimals: number,
  priceDecimals: number,
): string | null {
  const value = parse(tokens);
  if (!value || value.isNegative()) return null;

  const exponent = MATCHER_PRICE_SCALE + priceDecimals - amountDecimals;
  // A negative exponent is legitimate: an 8-decimal amount asset priced in a
  // 0-decimal asset gives 10^0. BigNumber.pow handles negatives, and toFixed(0)
  // rounds the result to an integer coin value.
  return value.times(new BigNumber(10).pow(exponent)).toFixed(0);
}

/**
 * Convert an integer coin balance back to human-readable tokens.
 *
 * @param coins - Balance in the asset's smallest unit.
 * @param decimals - Decimals of that asset.
 */
export function coinsToTokens(coins: number | string, decimals: number): number {
  const value = parse(coins);
  if (!value) return 0;
  return value.dividedBy(new BigNumber(10).pow(decimals)).toNumber();
}
