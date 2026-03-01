import { type Asset } from './Asset';
import { BigNumber } from '@decentralchain/bignumber';
import { toBigNumber } from '../utils';

/** Serialized representation of a Money instance, returned by `Money.toJSON()`. */
export interface IMoneyJSON {
  readonly assetId: string;
  readonly tokens: string;
}

/** Acceptable input types for monetary amounts. */
export type TMoneyInput = string | number | BigNumber;

/**
 * Represents a monetary amount tied to a specific Asset.
 *
 * Internally stores the value in "coins" (the smallest indivisible unit).
 * All arithmetic methods return **new** Money instances (immutable pattern).
 *
 * @example
 * ```ts
 * const money = Money.fromTokens(1.5, myAsset);
 * const sum = money.add(Money.fromTokens(0.5, myAsset));
 * console.log(sum.toTokens()); // "2.00000000"
 * ```
 */
export class Money {
  public readonly asset: Asset;

  private readonly _coins: BigNumber;
  private readonly _tokens: BigNumber;

  /**
   * Create a new Money instance from a coin amount.
   *
   * @param coins - The amount in the smallest indivisible unit.
   * @param asset - The asset this money represents.
   */
  constructor(coins: TMoneyInput, asset: Asset) {
    const divider = Money._getDivider(asset.precision);
    this.asset = asset;
    // ROUND_FLOOR = 3 (const enum not accessible with verbatimModuleSyntax)
    this._coins = toBigNumber(coins).roundTo(0, 3 as BigNumber.ROUND_MODE);
    this._tokens = this._coins.div(divider);
  }

  /** Get the coin amount as a new BigNumber (clone). */
  public getCoins(): BigNumber {
    return this._coins.add(0);
  }

  /** Get the token amount as a new BigNumber (clone). */
  public getTokens(): BigNumber {
    return this._tokens.add(0);
  }

  /** Return the coin amount as a fixed-point string with no decimals. */
  public toCoins(): string {
    return this._coins.toFixed(0);
  }

  /** Return the token amount as a fixed-point string with asset precision. */
  public toTokens(): string {
    return this._tokens.toFixed(this.asset.precision);
  }

  /** Return the token amount as a formatted string with optional precision. */
  public toFormat(precision?: number): string {
    return this._tokens.toFormat(precision);
  }

  /**
   * Add another Money amount to this one.
   *
   * @param money - Must share the same asset.
   * @returns A new Money instance with the summed coins.
   * @throws {Error} If assets do not match.
   */
  public add(money: Money): Money {
    this._matchAssets(money);
    const inputCoins = money.getCoins();
    const result = this._coins.add(inputCoins);
    return new Money(result, this.asset);
  }

  /** Alias for {@link add}. */
  public plus(money: Money): Money {
    return this.add(money);
  }

  /**
   * Subtract another Money amount from this one.
   *
   * @param money - Must share the same asset.
   * @returns A new Money instance with the difference.
   * @throws {Error} If assets do not match.
   */
  public sub(money: Money): Money {
    this._matchAssets(money);
    const inputCoins = money.getCoins();
    const result = this._coins.sub(inputCoins);
    return new Money(result, this.asset);
  }

  /** Alias for {@link sub}. */
  public minus(money: Money): Money {
    return this.sub(money);
  }

  /**
   * Multiply the coin amounts of two Money instances.
   *
   * @param money - Must share the same asset.
   * @returns A new Money instance.
   * @throws {Error} If assets do not match.
   */
  public times(money: Money): Money {
    this._matchAssets(money);
    return new Money(this.getCoins().mul(money.getCoins()), this.asset);
  }

  /**
   * Divide the coin amounts of two Money instances.
   *
   * @param money - Must share the same asset and have non-zero coins.
   * @returns A new Money instance.
   * @throws {Error} If assets do not match or divisor is zero.
   */
  public div(money: Money): Money {
    this._matchAssets(money);
    if (money.getCoins().isZero()) {
      throw new Error('Division by zero: cannot divide Money by a zero amount');
    }
    return new Money(this.getCoins().div(money.getCoins()), this.asset);
  }

  /** Check equality (same asset and coin amount). */
  public eq(money: Money): boolean {
    this._matchAssets(money);
    return this._coins.eq(money.getCoins());
  }

  /** Check if this amount is strictly less than another. */
  public lt(money: Money): boolean {
    this._matchAssets(money);
    return this._coins.lt(money.getCoins());
  }

  /** Check if this amount is less than or equal to another. */
  public lte(money: Money): boolean {
    this._matchAssets(money);
    return this._coins.lte(money.getCoins());
  }

  /** Check if this amount is strictly greater than another. */
  public gt(money: Money): boolean {
    this._matchAssets(money);
    return this._coins.gt(money.getCoins());
  }

  /** Check if this amount is greater than or equal to another. */
  public gte(money: Money): boolean {
    this._matchAssets(money);
    return this._coins.gte(money.getCoins());
  }

  /**
   * Subtract another Money, but only if assets match.
   * If assets differ, returns `this` unchanged.
   */
  public safeSub(money: Money): Money {
    if (this.asset.id === money.asset.id) {
      return this.sub(money);
    }
    return this;
  }

  /** Clamp this money to a minimum of zero (non-negative). */
  public toNonNegative(): Money {
    if (this.getTokens().lt(0)) {
      return this.cloneWithTokens(0);
    }
    return this;
  }

  /** Create a new Money with different coins but the same asset. */
  public cloneWithCoins(coins: TMoneyInput): Money {
    return new Money(coins, this.asset);
  }

  /** Create a new Money from a token amount, using this instance's asset. */
  public cloneWithTokens(tokens: TMoneyInput): Money {
    const coins = Money._tokensToCoins(tokens, this.asset.precision);
    return new Money(coins, this.asset);
  }

  /**
   * Convert this money to a different asset using an exchange rate.
   *
   * @param asset - The target asset.
   * @param exchangeRate - Conversion rate between the two assets.
   * @returns A new Money instance denominated in `asset`.
   */
  public convertTo(asset: Asset, exchangeRate: TMoneyInput): Money {
    return Money.convert(this, asset, toBigNumber(exchangeRate));
  }

  /** Serialize to a JSON-friendly object with assetId and token string. */
  public toJSON(): IMoneyJSON {
    return {
      assetId: this.asset.id,
      tokens: this.toTokens(),
    };
  }

  /** Return a human-readable string like `"1.50000000 ASSET_ID"`. */
  public toString(): string {
    return `${this.toTokens()} ${this.asset.id}`;
  }

  /** @throws {Error} If the other Money has a different asset. */
  private _matchAssets(money: Money): void {
    if (this.asset.id !== money.asset.id) {
      throw new Error(
        'You cannot apply arithmetic operations to Money created with different assets',
      );
    }
  }

  /**
   * Return the Money with the greatest value.
   *
   * @param moneyList - One or more Money instances (must share the same asset).
   * @throws {Error} If no arguments are provided.
   */
  public static max(...moneyList: Money[]): Money {
    if (moneyList.length === 0) {
      throw new Error('Money.max() requires at least one argument');
    }
    return moneyList.reduce((max, money) => (max.gte(money) ? max : money));
  }

  /**
   * Return the Money with the smallest value.
   *
   * @param moneyList - One or more Money instances (must share the same asset).
   * @throws {Error} If no arguments are provided.
   */
  public static min(...moneyList: Money[]): Money {
    if (moneyList.length === 0) {
      throw new Error('Money.min() requires at least one argument');
    }
    return moneyList.reduce((min, money) => (min.lte(money) ? min : money));
  }

  /** Type guard: check whether an object is a Money instance. */
  public static isMoney(object: object): object is Money {
    return object instanceof Money;
  }

  /**
   * Convert money to a different asset using an exchange rate.
   *
   * @param money - The source money.
   * @param asset - The target asset.
   * @param exchangeRate - Conversion rate.
   * @returns A new Money instance denominated in `asset`.
   */
  public static convert(money: Money, asset: Asset, exchangeRate: BigNumber | string): Money {
    if (money.asset.id === asset.id) {
      return money;
    }
    const difference = money.asset.precision - asset.precision;
    const divider = new BigNumber(10).pow(difference);
    const coins = money.getCoins();
    const result = coins
      .mul(exchangeRate)
      .div(divider)
      // ROUND_DOWN = 1 (const enum not accessible with verbatimModuleSyntax)
      .roundTo(0, 1 as BigNumber.ROUND_MODE)
      .toFixed();
    return new Money(new BigNumber(result), asset);
  }

  /**
   * Create Money from a human-readable token amount.
   *
   * @param count - Token amount (e.g. `1.5`).
   * @param asset - The asset.
   */
  public static fromTokens(count: TMoneyInput, asset: Asset): Money {
    const tokens = toBigNumber(count);
    return new Money(tokens.mul(new BigNumber(10).pow(asset.precision)), asset);
  }

  /**
   * Create Money from a raw coin amount.
   *
   * @param count - Coin amount (smallest indivisible unit).
   * @param asset - The asset.
   */
  public static fromCoins(count: TMoneyInput, asset: Asset): Money {
    return new Money(count, asset);
  }

  private static _tokensToCoins(tokens: TMoneyInput, precision: number): BigNumber {
    const divider = Money._getDivider(precision);
    const fixed = toBigNumber(tokens).toFixed(precision);
    return new BigNumber(fixed).mul(divider);
  }

  private static _getDivider(precision: number): BigNumber {
    return new BigNumber(10).pow(precision);
  }
}
