import { compose, isNil, reject } from 'ramda';
import { renameKeys } from 'ramda-adjunct';
import { transformTxInfo } from '../../_common/transformTxInfo';

export default compose(
  transformTxInfo,
  renameKeys({
    dapp: 'dApp',
    fee_asset_id: 'feeAssetId',
  }),
  reject(isNil),
);
