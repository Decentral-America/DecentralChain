import { Asset, type IAssetJSON } from '@decentralchain/data-entities';
import { compose, renameKeys } from 'ramda';
import { type AssetDbResponse } from './types';

export const transformDbResponse = (raw: AssetDbResponse): Asset =>
  compose(
    (obj) => new Asset(obj),
    renameKeys<IAssetJSON, AssetDbResponse>({
      asset_id: 'id',
      asset_name: 'name',
      decimals: 'precision',
      has_script: 'hasScript',
      issue_height: 'height',
      issue_timestamp: 'timestamp',
      min_sponsored_asset_fee: 'minSponsoredFee',
      total_quantity: 'quantity',
    }),
  )(raw);
