import { fetchDetails, type TAssetDetails } from '../../api-node/assets';
import getAssetIdListByTx from './getAssetIdListByTx';
import { type Transaction } from '@decentralchain/ts-types';
import { type TLong } from '../../interface';
import { indexBy, prop } from '../utils';

export default function (
  base: string,
  tx: Transaction<TLong> | Transaction<TLong>[],
): Promise<Record<string, TAssetDetails>> {
  return fetchDetails(base, getAssetIdListByTx(tx)).then((list) => indexBy(prop('assetId'), list));
}
