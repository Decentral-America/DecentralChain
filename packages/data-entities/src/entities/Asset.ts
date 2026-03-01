import { type BigNumber } from '@decentralchain/bignumber';
import { config } from '../config';
import { toBigNumber } from '../utils';

/** Raw asset information used to construct an Asset instance. */
export interface IAssetInfo {
  readonly ticker?: string;
  readonly id: string;
  readonly name: string;
  readonly precision: number;
  readonly description: string;
  readonly height: number;
  readonly timestamp: Date;
  readonly sender: string;
  readonly quantity: BigNumber | string | number;
  readonly reissuable: boolean;
  readonly hasScript?: boolean;
  readonly minSponsoredFee?: BigNumber | string | number;
}

/** Serialized representation of an Asset, returned by `Asset.toJSON()`. */
export interface IAssetJSON {
  readonly ticker: string | null;
  readonly id: string;
  readonly name: string;
  readonly precision: number;
  readonly description: string;
  readonly height: number;
  readonly timestamp: Date;
  readonly sender: string;
  readonly quantity: BigNumber;
  readonly reissuable: boolean;
  readonly hasScript: boolean;
  readonly minSponsoredFee: BigNumber | null;
}

/**
 * Represents a blockchain asset with metadata and quantity information.
 *
 * Instances are effectively immutable — all properties are readonly.
 */
export class Asset {
  public readonly ticker: string | null;
  public readonly id: string;
  public readonly name: string;
  public readonly precision: number;
  public readonly description: string;
  public readonly height: number;
  public readonly timestamp: Date;
  public readonly sender: string;
  public readonly quantity: BigNumber;
  public readonly reissuable: boolean;
  public readonly hasScript: boolean;
  public readonly minSponsoredFee: BigNumber | null;
  public readonly displayName: string;

  /**
   * Create a new Asset instance.
   *
   * @param assetObject - Raw asset data. Passed through the global config
   *   `remapAsset` function before being applied.
   */
  constructor(assetObject: IAssetInfo) {
    const remapped = config.get('remapAsset')(assetObject);

    // ── Validate critical fields ──────────────────────────────────
    if (typeof remapped.id !== 'string' || remapped.id.length === 0) {
      throw new Error('Invalid asset id: must be a non-empty string');
    }
    if (typeof remapped.name !== 'string' || remapped.name.length === 0) {
      throw new Error('Invalid asset name: must be a non-empty string');
    }
    if (typeof remapped.sender !== 'string' || remapped.sender.length === 0) {
      throw new Error('Invalid asset sender: must be a non-empty string');
    }
    if (!Number.isInteger(remapped.precision) || remapped.precision < 0) {
      throw new Error(
        `Invalid precision: ${String(remapped.precision)} — must be a non-negative integer`,
      );
    }
    if (!Number.isInteger(remapped.height) || remapped.height < 0) {
      throw new Error(
        `Invalid height: ${String(remapped.height)} — must be a non-negative integer`,
      );
    }

    this.quantity = toBigNumber(remapped.quantity);
    this.minSponsoredFee =
      remapped.minSponsoredFee != null ? toBigNumber(remapped.minSponsoredFee) : null;

    this.ticker = remapped.ticker ?? null;
    this.id = remapped.id;
    this.name = remapped.name;
    this.precision = remapped.precision;
    this.description = remapped.description;
    this.height = remapped.height;
    this.timestamp = remapped.timestamp;
    this.sender = remapped.sender;
    this.reissuable = remapped.reissuable;
    this.hasScript = remapped.hasScript ?? false;
    this.displayName = remapped.ticker ?? remapped.name;
  }

  /** Serialize this Asset to a plain JSON-friendly object. */
  public toJSON(): IAssetJSON {
    return {
      ticker: this.ticker,
      id: this.id,
      name: this.name,
      precision: this.precision,
      description: this.description,
      height: this.height,
      timestamp: this.timestamp,
      sender: this.sender,
      quantity: this.quantity,
      reissuable: this.reissuable,
      hasScript: this.hasScript,
      minSponsoredFee: this.minSponsoredFee,
    };
  }

  /** Return the asset ID as a string representation. */
  public toString(): string {
    return this.id;
  }

  /** Type guard: check whether an object is an Asset instance. */
  public static isAsset(object: object): object is Asset {
    return object instanceof Asset;
  }
}
