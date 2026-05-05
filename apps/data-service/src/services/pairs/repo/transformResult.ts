import { type BigNumber } from '@decentralchain/data-entities';
import { renameKeys } from 'ramda-adjunct';
import { type AssetIdsPair, type PairInfo } from '../../../types';

export type PairDbResponse = {
  amount_asset_id: string;
  price_asset_id: string;
  first_price: BigNumber;
  last_price: BigNumber;
  volume: BigNumber;
  quote_volume: BigNumber;
  high: BigNumber;
  low: BigNumber;
  weighted_average_price: BigNumber;
  txs_count: number;
  volume_waves: BigNumber;
};

/** renamePairFields :: Object -> Object */
const renamePairFields = renameKeys<PairInfo & AssetIdsPair>({
  amount_asset_id: 'amountAsset',
  first_price: 'firstPrice',
  last_price: 'lastPrice',
  price_asset_id: 'priceAsset',
  quote_volume: 'quoteVolume',
  txs_count: 'txsCount',
  volume_waves: 'volumeWaves',
  weighted_average_price: 'weightedAveragePrice',
});

/** transformResult :: Object -> Object */
export const transformResult = renamePairFields;
