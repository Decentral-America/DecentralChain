import BigNum from 'bignumber.js';
import { Config, type IFormat } from './Config.js';

/** Input types accepted by BigNumber methods. */
type TLong = string | number | BigNumber;

/**
 * Arbitrary-precision number wrapper for the DecentralChain SDK.
 *
 * All arithmetic operations return **new** instances (immutable).
 * Built on top of `bignumber.js` with blockchain-specific helpers
 * such as byte serialization for signed/unsigned 64-bit integers.
 */
export class BigNumber {
  /** The underlying bignumber.js instance. */
  public readonly bn: BigNum;

  /** Minimum signed 64-bit integer (`-9223372036854775808`). */
  public static readonly MIN_VALUE = new BigNumber('-9223372036854775808');

  /** Maximum signed 64-bit integer (`9223372036854775807`). */
  public static readonly MAX_VALUE = new BigNumber('9223372036854775807');

  /** Minimum unsigned 64-bit integer (`0`). */
  public static readonly MIN_UNSIGNED_VALUE = new BigNumber('0');

  /** Maximum unsigned 64-bit integer (`18446744073709551615`). */
  public static readonly MAX_UNSIGNED_VALUE = new BigNumber('18446744073709551615');

  /** Global configuration for formatting and rounding. */
  public static config = new Config();

  /**
   * Creates a new BigNumber instance.
   * @param long - A numeric value: string, number, bignumber.js instance, or another BigNumber.
   */
  constructor(long: TLong | BigNum | BigNumber) {
    if (typeof long === 'object' && BigNumber.isBigNumber(long)) {
      this.bn = long.bn.plus(0);
    } else {
      this.bn = BigNumber.toBigNumberJs(long);
    }
    if (this.bn.isNaN()) {
      throw new Error(
        `Invalid BigNumber value: ${typeof long === 'object' ? String(long) : JSON.stringify(long)}`,
      );
    }
    if (!this.bn.isFinite()) {
      throw new Error(
        `Infinite values are not permitted in financial operations: ${typeof long === 'object' ? String(long) : JSON.stringify(long)}`,
      );
    }
  }

  /** Returns a deep copy of this BigNumber. */
  public clone(): BigNumber {
    return new BigNumber(this);
  }

  /** Returns a new BigNumber equal to this + `long`. */
  public add(long: TLong): BigNumber {
    return new BigNumber(this.bn.plus(BigNumber.toBigNumberJs(long)));
  }

  /** Returns a new BigNumber equal to this - `long`. */
  public sub(long: TLong): BigNumber {
    return new BigNumber(this.bn.minus(BigNumber.toBigNumberJs(long)));
  }

  /** Returns a new BigNumber equal to this * `long`. */
  public mul(long: TLong): BigNumber {
    return new BigNumber(this.bn.times(BigNumber.toBigNumberJs(long)));
  }

  /** Returns a new BigNumber equal to this / `long`.
   * @throws {Error} If `long` is zero — division by zero is not permitted in financial operations.
   */
  public div(long: TLong): BigNumber {
    const divisor = BigNumber.toBigNumberJs(long);
    if (divisor.isZero()) {
      throw new Error('Division by zero is not permitted');
    }
    return new BigNumber(this.bn.div(divisor));
  }

  /** Returns a new BigNumber equal to this raised to the power of `exp`. */
  public pow(exp: TLong): BigNumber {
    return new BigNumber(this.bn.pow(BigNumber.toBigNumberJs(exp)));
  }

  /** Returns a new BigNumber equal to the square root of this value.
   * @throws {Error} If this value is negative — square root of negative numbers is not permitted.
   */
  public sqrt(): BigNumber {
    if (this.isNegative()) {
      throw new Error('Square root of a negative number is not permitted');
    }
    return new BigNumber(this.bn.sqrt());
  }

  /** Returns a new BigNumber equal to the absolute value. */
  public abs(): BigNumber {
    return new BigNumber(this.bn.abs());
  }

  /** Returns a new BigNumber equal to this modulo `divider`.
   * @throws {Error} If `divider` is zero — modulo by zero is not permitted.
   */
  public mod(divider: TLong): BigNumber {
    const divisor = BigNumber.toBigNumberJs(divider);
    if (divisor.isZero()) {
      throw new Error('Modulo by zero is not permitted');
    }
    return new BigNumber(this.bn.mod(divisor));
  }

  /**
   * Returns a new BigNumber rounded to the given number of decimal places.
   * @param decimals - Number of decimal places (default: 0).
   * @param mode - Rounding mode (default: ROUND_HALF_UP).
   */
  public roundTo(
    decimals = 0,
    mode: BigNumber.ROUND_MODE = BigNumber.ROUND_MODE.ROUND_HALF_UP,
  ): BigNumber {
    return new BigNumber(this.bn.dp(decimals || 0, mode));
  }

  /** Returns `true` if this value equals `long`. */
  public eq(long: TLong): boolean {
    return this.bn.eq(BigNumber.toBigNumberJs(long));
  }

  /** Returns `true` if this value is less than `long`. */
  public lt(long: TLong): boolean {
    return this.bn.lt(BigNumber.toBigNumberJs(long));
  }

  /** Returns `true` if this value is greater than `long`. */
  public gt(long: TLong): boolean {
    return this.bn.gt(BigNumber.toBigNumberJs(long));
  }

  /** Returns `true` if this value is less than or equal to `long`. */
  public lte(long: TLong): boolean {
    return this.bn.lte(BigNumber.toBigNumberJs(long));
  }

  /** Returns `true` if this value is greater than or equal to `long`. */
  public gte(long: TLong): boolean {
    return this.bn.gte(BigNumber.toBigNumberJs(long));
  }

  /** Returns `true` if this value is NaN. */
  public isNaN(): boolean {
    return this.bn.isNaN();
  }

  /** Returns `true` if this value is finite. */
  public isFinite(): boolean {
    return this.bn.isFinite();
  }

  /** Returns `true` if this value is zero. */
  public isZero(): boolean {
    return this.eq(0);
  }

  /** Returns `true` if this value is positive (> 0). */
  public isPositive(): boolean {
    return this.gt(0);
  }

  /** Returns `true` if this value is negative (< 0). */
  public isNegative(): boolean {
    return this.lt(0);
  }

  /** Returns `true` if this value is an integer (no fractional part). */
  public isInt(): boolean {
    return this.bn.isInteger();
  }

  /** Returns the number of decimal places, or `null` if the value is NaN. */
  public getDecimalsCount(): number | null {
    return this.bn.dp();
  }

  /** Returns `true` if this value is even. */
  public isEven(): boolean {
    return this.mod(2).eq(0);
  }

  /** Returns `true` if this value is odd. */
  public isOdd(): boolean {
    return !this.isEven();
  }

  /** Returns `true` if this value is within the signed 64-bit integer range. */
  public isInSignedRange(): boolean {
    return this.gte(BigNumber.MIN_VALUE) && this.lte(BigNumber.MAX_VALUE);
  }

  /** Returns `true` if this value is within the unsigned 64-bit integer range. */
  public isInUnsignedRange(): boolean {
    return this.gte(BigNumber.MIN_UNSIGNED_VALUE) && this.lte(BigNumber.MAX_UNSIGNED_VALUE);
  }

  /**
   * Returns a formatted string with group separators.
   * @param decimals - Decimal places.
   * @param roundMode - Rounding mode.
   * @param format - Custom format options.
   */
  public toFormat(decimals?: number, roundMode?: BigNumber.ROUND_MODE, format?: IFormat): string {
    if (decimals === undefined) {
      return this.bn.toFormat();
    }
    return this.bn.toFormat(decimals, roundMode as BigNum.RoundingMode, format);
  }

  /**
   * Returns a string in fixed-point notation.
   * @param decimals - Decimal places.
   * @param roundMode - Rounding mode.
   */
  public toFixed(decimals?: number, roundMode?: BigNumber.ROUND_MODE): string {
    if (decimals == null) {
      return this.bn.toFixed();
    } else {
      return this.bn.toFixed(decimals, roundMode);
    }
  }

  /**
   * Returns a string representation of this value.
   * @param base - Numeric base (2–36). Defaults to 10.
   */
  public toString(base?: number): string {
    return base ? this.bn.toString(base) : this.toFixed();
  }

  /** Returns a JavaScript number. **Warning:** may lose precision for large values. */
  public toNumber(): number {
    return this.bn.toNumber();
  }

  /** Returns a fixed-point string suitable for JSON serialization. */
  public toJSON(): string {
    return this.bn.toFixed();
  }

  /** Returns the primitive string value (used by implicit coercion). */
  public valueOf(): string {
    return this.bn.valueOf();
  }

  /**
   * Serializes this integer to a byte array (big-endian, two's complement).
   * @param options.isSigned - Use signed encoding (default: `true`).
   * @param options.isLong - Fixed 8-byte output (default: `true`).
   * @throws {Error} If the value has decimals, is negative in unsigned mode, or is out of range.
   */
  public toBytes({ isSigned = true, isLong = true } = {}): Uint8Array {
    if (!this.isInt()) {
      throw new Error('Cant create bytes from number with decimals!');
    }

    if (!isSigned && this.isNegative()) {
      throw new Error("Can't create bytes from negative number in unsigned mode!");
    }

    if (isLong && isSigned && !this.isInSignedRange()) {
      throw new Error('Number is not from signed numbers range');
    }

    if (isLong && !isSigned && !this.isInUnsignedRange()) {
      throw new Error('Number is not from unsigned numbers range');
    }

    const isNegative = isSigned && this.isNegative();

    const toAdd = isNegative ? '1' : '0';
    const byteString = this.bn.plus(toAdd).toString(2).replace('-', '');

    const stringLength = isLong ? 64 : Math.ceil(byteString.length / 8) * 8;

    const baseStr = BigNumber._toLength(stringLength, byteString);

    const baseStrArr = baseStr.split('');
    const bytes = [];

    do {
      bytes.push(parseInt(baseStrArr.splice(0, 8).join(''), 2));
    } while (baseStrArr.length);

    return isNegative ? Uint8Array.from(bytes.map((byte) => 255 - byte)) : Uint8Array.from(bytes);
  }

  /**
   * Deserializes a byte array into a BigNumber.
   * @param bytes - The byte array to decode.
   * @param options.isSigned - Interpret as signed (default: `true`).
   * @param options.isLong - Expect exactly 8 bytes (default: `true`).
   * @throws {Error} If `isLong` is true and bytes length is not 8.
   */
  public static fromBytes(
    bytes: Uint8Array | number[],
    { isSigned = true, isLong = true } = {},
  ): BigNumber {
    if (isLong && bytes.length !== 8) {
      throw new Error('Wrong bytes length! Minimal length is 8 byte!');
    }

    bytes = (!isLong && bytes.length > 0) || isLong ? bytes : [0];

    const firstByte = bytes[0] ?? 0;
    const isNegative = isSigned ? firstByte > 127 : false;

    const byteString = Array.from(bytes)
      .map((byte) => (isNegative ? 255 - byte : byte))
      .map((byte) => BigNumber._toLength(8, byte.toString(2)))
      .join('');

    const result = new BigNumber(new BigNum(byteString, 2));

    return isNegative ? result.mul(-1).sub(1) : result;
  }

  /** Returns a new BigNumber equal to the maximum of the given values.
   * @throws {Error} If no values are provided.
   */
  public static max(...items: TLong[]): BigNumber {
    if (items.length === 0) {
      throw new Error('BigNumber.max() requires at least one argument');
    }
    return BigNumber.toBigNumber(items).reduce((max, item) => (max.gte(item) ? max : item));
  }

  /** Returns a new BigNumber equal to the minimum of the given values.
   * @throws {Error} If no values are provided.
   */
  public static min(...items: TLong[]): BigNumber {
    if (items.length === 0) {
      throw new Error('BigNumber.min() requires at least one argument');
    }
    return BigNumber.toBigNumber(items).reduce((min, item) => (min.lte(item) ? min : item));
  }

  /** Returns a new BigNumber equal to the sum of the given values.
   * @throws {Error} If no values are provided.
   */
  public static sum(...items: TLong[]): BigNumber {
    if (items.length === 0) {
      throw new Error('BigNumber.sum() requires at least one argument');
    }
    return BigNumber.toBigNumber(items).reduce((acc, item) => acc.add(item));
  }

  /** Type guard: returns `true` if `some` is a BigNumber instance (or duck-types as one). */
  public static isBigNumber(some: unknown): some is BigNumber {
    if (!some || typeof some !== 'object') {
      return false;
    }
    if (some instanceof BigNumber) {
      return true;
    }
    const proto = BigNumber.prototype as unknown as Record<string, unknown>;
    const protoKeys = Object.getOwnPropertyNames(proto).filter(
      (key) => key !== 'constructor' && !key.startsWith('_'),
    );
    const target = some as Record<string, unknown>;
    return protoKeys.every((key) => key in target && typeof proto[key] === typeof target[key]);
  }

  /**
   * Converts one or more values to BigNumber instances.
   * Accepts a single value or an array of values.
   */
  public static toBigNumber(items: TLong): BigNumber;
  public static toBigNumber(items: TLong[]): BigNumber[];
  public static toBigNumber(items: TLong | TLong[]): BigNumber | BigNumber[] {
    if (Array.isArray(items)) {
      return items.map((item) => new BigNumber(item));
    } else {
      return new BigNumber(items);
    }
  }

  protected static toBigNumberJs(long: TLong | BigNum): BigNum {
    if (BigNum.isBigNumber(long)) {
      return long;
    } else if (long instanceof BigNumber) {
      return long.bn;
    } else {
      return new BigNum(long);
    }
  }

  private static _toLength(length: number, bytes: string): string {
    return new Array(length).fill('0', 0, length).concat(bytes.split('')).slice(-length).join('');
  }
}

// biome-ignore lint/style/noNamespace: declaration merging for BigNumber.ROUND_MODE enum
export namespace BigNumber {
  /** Available rounding modes, matching bignumber.js semantics. */
  export enum ROUND_MODE {
    ROUND_UP,
    ROUND_DOWN,
    ROUND_CEIL,
    ROUND_FLOOR,
    ROUND_HALF_UP,
    ROUND_HALF_DOWN,
    ROUND_HALF_EVEN,
    ROUND_HALF_CEIL,
    ROUND_HALF_FLOOR,
  }
}
