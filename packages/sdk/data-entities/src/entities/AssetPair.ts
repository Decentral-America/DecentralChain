import { type Asset } from './Asset';

/** Serialized representation of an AssetPair, returned by `AssetPair.toJSON()`. */
export interface IAssetPairJSON {
  readonly amountAsset: string;
  readonly priceAsset: string;
}

/**
 * Represents a trading pair of two assets: an amount asset and a price asset.
 *
 * The `precisionDifference` is computed as `priceAsset.precision - amountAsset.precision`.
 */
export class AssetPair {
  public readonly amountAsset: Asset;
  public readonly priceAsset: Asset;
  public readonly precisionDifference: number;

  /**
   * Create a new AssetPair.
   *
   * @param amountAsset - The asset that represents the traded amount.
   * @param priceAsset - The asset that represents the price denomination.
   */
  constructor(amountAsset: Asset, priceAsset: Asset) {
    this.amountAsset = amountAsset;
    this.priceAsset = priceAsset;
    this.precisionDifference = this.priceAsset.precision - this.amountAsset.precision;
  }

  /** Serialize this AssetPair to a plain JSON-friendly object. */
  public toJSON(): IAssetPairJSON {
    return {
      amountAsset: this.amountAsset.id,
      priceAsset: this.priceAsset.id,
    };
  }

  /** Return a string representation of the pair (e.g. `"BTC/USD"`). */
  public toString(): string {
    return `${this.amountAsset.toString()}/${this.priceAsset.toString()}`;
  }

  /** Type guard: check whether an object is an AssetPair instance. */
  public static isAssetPair(object: object): object is AssetPair {
    return object instanceof AssetPair;
  }
}
