import { type BigNumber } from '@decentralchain/bignumber';
import { config } from '../config';
import { toBigNumber } from '../utils';

/** Raw candle data used to construct a Candle instance. */
export interface ICandleInfo {
  readonly time: Date;
  readonly open: BigNumber | string | number;
  readonly close: BigNumber | string | number;
  readonly high: BigNumber | string | number;
  readonly low: BigNumber | string | number;
  readonly volume: BigNumber | string | number;
  readonly quoteVolume: BigNumber | string | number;
  readonly weightedAveragePrice: BigNumber | string | number;
  readonly maxHeight: number;
  readonly txsCount: number;
}

/** Serialized representation of a Candle, returned by `Candle.toJSON()`. */
export interface ICandleJSON {
  readonly time: Date;
  readonly open: BigNumber;
  readonly close: BigNumber;
  readonly high: BigNumber;
  readonly low: BigNumber;
  readonly volume: BigNumber;
  readonly quoteVolume: BigNumber;
  readonly weightedAveragePrice: BigNumber;
  readonly maxHeight: number;
  readonly txsCount: number;
}

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

    this.open = toBigNumber(remapped.open);
    this.close = toBigNumber(remapped.close);
    this.high = toBigNumber(remapped.high);
    this.low = toBigNumber(remapped.low);
    this.volume = toBigNumber(remapped.volume);
    this.quoteVolume = toBigNumber(remapped.quoteVolume);
    this.weightedAveragePrice = toBigNumber(remapped.weightedAveragePrice);

    this.time = remapped.time;
    this.maxHeight = remapped.maxHeight;
    this.txsCount = remapped.txsCount;
  }

  /** Serialize this Candle to a plain JSON-friendly object. */
  public toJSON(): ICandleJSON {
    return {
      time: this.time,
      open: this.open,
      close: this.close,
      high: this.high,
      low: this.low,
      volume: this.volume,
      quoteVolume: this.quoteVolume,
      weightedAveragePrice: this.weightedAveragePrice,
      maxHeight: this.maxHeight,
      txsCount: this.txsCount,
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
