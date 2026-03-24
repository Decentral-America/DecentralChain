import { type BigNumber } from '@decentralchain/bignumber';

/** Raw asset information used to construct an Asset instance. */
export interface IAssetInfo {
  readonly ticker?: string | null | undefined;
  readonly id: string;
  readonly name: string;
  readonly precision: number;
  readonly description: string;
  readonly height: number;
  readonly timestamp: Date;
  readonly sender: string;
  readonly quantity: BigNumber | string | number;
  readonly reissuable: boolean;
  readonly hasScript?: boolean | undefined;
  readonly minSponsoredFee?: BigNumber | string | number | null | undefined;
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
