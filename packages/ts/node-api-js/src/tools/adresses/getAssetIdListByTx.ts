import { type Transaction } from '@decentralchain/ts-types';
import { NAME_MAP } from '../../constants';
import { type TLong } from '../../interface';
import { prop, switchTransactionByType, toArray } from '../utils';

const getAssetIdList = switchTransactionByType({
  [NAME_MAP.transfer]: (tx) => [tx.assetId, tx.feeAssetId],
  [NAME_MAP.burn]: (tx) => [tx.assetId],
  [NAME_MAP.reissue]: (tx) => [tx.assetId],
  [NAME_MAP.exchange]: (tx) =>
    Array.from(
      new Set([
        tx.order1.assetPair.amountAsset,
        tx.order1.assetPair.priceAsset,
        tx.order1.version === 3 ? tx.order1.matcherFeeAssetId : null,
        tx.order2.version === 3 ? tx.order2.matcherFeeAssetId : null,
      ]),
    ),
  [NAME_MAP.massTransfer]: (tx) => [tx.assetId],
  [NAME_MAP.setAssetScript]: (tx) => [tx.assetId],
  [NAME_MAP.sponsorship]: (tx) => [tx.assetId],
  [NAME_MAP.invoke]: (tx) => [...(tx.payment ?? []).map(prop('assetId')), tx.feeAssetId],
  [NAME_MAP.updateAsset]: (tx) => [tx.assetId],
});

export default function (tx: Transaction<TLong> | Transaction<TLong>[]): string[] {
  // Cast required: switchTransactionByType's conditional type doesn't distribute
  // over the Transaction union — at runtime it correctly returns arrays for matching types
  const getIds = getAssetIdList as (tx: Transaction<TLong>) => (string | null)[] | undefined;
  return toArray(tx)
    .flatMap((t) => getIds(t) ?? [])
    .filter((x): x is string => x !== null);
}
