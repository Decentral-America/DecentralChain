import { default as BigNum } from 'bignumber.js';
import { type BigNumber } from './BigNumber.js';

/**
 * Global configuration manager for BigNumber formatting and rounding.
 *
 * Wraps `bignumber.js` configuration with a stateful format object
 * that can be incrementally updated via {@link Config.set}.
 */
export class Config {
  private static readonly DEFAULT_FORMAT: IFormat = {
    prefix: '',
    decimalSeparator: '.',
    groupSeparator: ',',
    groupSize: 3,
    secondaryGroupSize: 0,
    fractionGroupSeparator: ' ',
    fractionGroupSize: 0,
    suffix: '',
  };

  private format: IFormat;

  /** Creates a new Config with default bignumber.js FORMAT settings. */
  constructor() {
    this.format = { ...Config.DEFAULT_FORMAT };
    BigNum.config({ FORMAT: this.format });
  }

  /**
   * Merges the given configuration into the current settings.
   * FORMAT fields are shallowly merged with the existing format.
   * @param configPart - Partial configuration to apply.
   */
  public set(configPart: Partial<IConfig>): void {
    if ('FORMAT' in configPart) {
      this.format = { ...this.format, ...configPart.FORMAT };
      configPart.FORMAT = this.format;
    }
    BigNum.config(configPart);
  }
}

/** Configuration options for BigNumber behavior. */
export interface IConfig {
  /** Global rounding mode for arithmetic operations. */
  ROUNDING_MODE: BigNumber.ROUND_MODE;
  /** Partial format overrides for `toFormat()` output. */
  FORMAT: Partial<IFormat>;
}

/** Number format settings used by `BigNumber.toFormat()`. */
export interface IFormat {
  prefix: string;
  decimalSeparator: string;
  groupSeparator: string;
  groupSize: number;
  secondaryGroupSize: number;
  fractionGroupSeparator: string;
  fractionGroupSize: number;
  suffix: string;
}
