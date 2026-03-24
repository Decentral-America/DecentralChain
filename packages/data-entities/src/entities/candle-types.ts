import { type BigNumber } from '@decentralchain/bignumber';

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
  /** Block height of the last transaction in this candle. May be null for empty candles. */
  readonly maxHeight: number | null | undefined;
  /** Number of transactions in this candle. May be null for empty candles. */
  readonly txsCount: number | null | undefined;
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
