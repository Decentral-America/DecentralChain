import { compose, isNil, reject, renameKeys } from 'ramda';
import { transformTxInfo } from '../../_common/transformTxInfo';

export default (compose as any)(
  transformTxInfo,
  renameKeys<Record<string, unknown>>({
    dapp: 'dApp',
    fee_asset_id: 'feeAssetId',
  }),
  reject(isNil),
) as (obj: any) => any;
