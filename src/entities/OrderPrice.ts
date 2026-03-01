import { BigNumber } from '@decentralchain/bignumber';
import { type AssetPair } from './AssetPair';
import { toBigNumber } from '../utils';

/** Serialized representation of an OrderPrice, returned by `OrderPrice.toJSON()`. */
export interface IOrderPriceJSON {
  readonly amountAssetId: string;
  readonly priceAssetId: string;
  readonly priceTokens: string;
}

/**
 * Represents an order price in a trading pair.
 *
 * Internally stores the price in "matcher coins" (a fixed-point 10^8 scale).
 * All operations return **new** instances (immutable pattern).
 */
export class OrderPrice {
  public readonly pair: AssetPair;

  private readonly _matcherCoins: BigNumber;
  private readonly _tokens: BigNumber;

  private static readonly _MATCHER_SCALE = new BigNumber(10).pow(8);

  /**
   * Create a new OrderPrice from matcher coins.
   *
   * @param coins - The price in matcher-scale coins.
   * @param pair - The trading pair.
   */
  constructor(coins: BigNumber, pair: AssetPair) {
    const divider = OrderPrice._getMatcherDivider(pair.precisionDifference);
    this.pair = pair;
    this._matcherCoins = coins;
    this._tokens = this._matcherCoins.div(divider);
  }

  /** Get the matcher coin amount as a new BigNumber (clone). */
  public getMatcherCoins(): BigNumber {
    return this._matcherCoins.clone();
  }

  /** Get the token amount as a new BigNumber (clone). */
  public getTokens(): BigNumber {
    return this._tokens.clone();
  }

  /** Return the matcher coin amount as a fixed-point string with no decimals. */
  public toMatcherCoins(): string {
    return this._matcherCoins.toFixed(0);
  }

  /** Return the token amount as a fixed-point string with price-asset precision. */
  public toTokens(): string {
    return this._tokens.toFixed(this.pair.priceAsset.precision);
  }

  /** Return the token amount as a formatted string with price-asset precision. */
  public toFormat(): string {
    return this._tokens.toFormat(this.pair.priceAsset.precision);
  }

  /** Serialize to a JSON-friendly object. */
  public toJSON(): IOrderPriceJSON {
    return {
      amountAssetId: this.pair.amountAsset.id,
      priceAssetId: this.pair.priceAsset.id,
      priceTokens: this.toTokens(),
    };
  }

  /** Return a human-readable string like `"1.50 BTC/USD"`. */
  public toString(): string {
    return `${this.toTokens()} ${this.pair.amountAsset.id}/${this.pair.priceAsset.id}`;
  }

  /**
   * Create an OrderPrice from matcher coins.
   *
   * @param coins - The price in matcher-scale coins.
   * @param pair - The trading pair.
   * @throws {Error} If the amount is not a valid type.
   */
  public static fromMatcherCoins(coins: string | number | BigNumber, pair: AssetPair): OrderPrice {
    OrderPrice._checkAmount(coins);
    return new OrderPrice(toBigNumber(coins), pair);
  }

  /**
   * Create an OrderPrice from a human-readable token price.
   *
   * @param tokens - The price in token units.
   * @param pair - The trading pair.
   * @throws {Error} If the amount is not a valid type.
   */
  public static fromTokens(tokens: string | number | BigNumber, pair: AssetPair): OrderPrice {
    OrderPrice._checkAmount(tokens);
    const fixed = toBigNumber(tokens).toFixed(pair.priceAsset.precision);
    const divider = OrderPrice._getMatcherDivider(pair.precisionDifference);
    const coins = new BigNumber(fixed).mul(divider);
    return new OrderPrice(coins, pair);
  }

  private static _getMatcherDivider(precision: number): BigNumber {
    return new BigNumber(10).pow(precision).mul(OrderPrice._MATCHER_SCALE);
  }

  /** Type guard: check whether an object is an OrderPrice instance. */
  public static isOrderPrice(object: object): object is OrderPrice {
    return object instanceof OrderPrice;
  }

  /**
   * Validate that the given amount is a string, number, or BigNumber.
   *
   * @param amount - The value to validate.
   * @throws {Error} If the amount is not a valid type.
   */
  private static _checkAmount(amount: string | number | BigNumber): void {
    if (
      !(typeof amount === 'string' || typeof amount === 'number' || amount instanceof BigNumber)
    ) {
      throw new Error(
        'Please use strings, numbers, or BigNumber to create instances of OrderPrice',
      );
    }
  }
}
