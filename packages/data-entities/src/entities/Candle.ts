import { type BigNumber } from '@decentralchain/bignumber';
import { config } from '../config';
import { toBigNumber } from '../utils';
import { type ICandleInfo, type ICandleJSON } from './candle-types';

export type { ICandleInfo, ICandleJSON } from './candle-types';

/**
 * Represents a candlestick chart data point with OHLCV values.
 *
 * All numeric fields are stored as BigNumber instances for precision.
 */
export class Candle {
  public readonly time: Date;
  public readonly open: BigNumber;
  public readonly close: BigNumber;
  public readonly high: BigNumber;
  public readonly low: BigNumber;
  public readonly volume: BigNumber;
  public readonly quoteVolume: BigNumber;
  public readonly weightedAveragePrice: BigNumber;
  public readonly maxHeight: number;
  public readonly txsCount: number;

  /**
   * Create a new Candle instance.
   *
   * @param candleObject - Raw candle data. Passed through the global config
   *   `remapCandle` function before being applied.
   */
  constructor(candleObject: ICandleInfo) {
    const remapped = config.get('remapCandle')(candleObject);

    // ── Validate integer fields ───────────────────────────────────
    // maxHeight and txsCount may be null/undefined for empty candles returned by the API.
    const maxHeight = remapped.maxHeight ?? 0;
    const txsCount = remapped.txsCount ?? 0;
    if (!Number.isInteger(maxHeight) || maxHeight < 0) {
      throw new Error(
        `Invalid maxHeight: ${String(remapped.maxHeight)} — must be a non-negative integer`,
      );
    }
    if (!Number.isInteger(txsCount) || txsCount < 0) {
      throw new Error(
        `Invalid txsCount: ${String(remapped.txsCount)} — must be a non-negative integer`,
      );
    }

    this.open = toBigNumber(remapped.open);
    this.close = toBigNumber(remapped.close);
    this.high = toBigNumber(remapped.high);
    this.low = toBigNumber(remapped.low);
    this.volume = toBigNumber(remapped.volume);
    this.quoteVolume = toBigNumber(remapped.quoteVolume);
    this.weightedAveragePrice = toBigNumber(remapped.weightedAveragePrice);

    this.time = remapped.time;
    this.maxHeight = maxHeight;
    this.txsCount = txsCount;
  }

  /** Serialize this Candle to a plain JSON-friendly object. */
  public toJSON(): ICandleJSON {
    return {
      close: this.close,
      high: this.high,
      low: this.low,
      maxHeight: this.maxHeight,
      open: this.open,
      quoteVolume: this.quoteVolume,
      time: this.time,
      txsCount: this.txsCount,
      volume: this.volume,
      weightedAveragePrice: this.weightedAveragePrice,
    };
  }

  /** Return a string representation. */
  public toString(): string {
    return '[object Candle]';
  }

  /** Type guard: check whether an object is a Candle instance. */
  public static isCandle(object: object): object is Candle {
    return object instanceof Candle;
  }
}
