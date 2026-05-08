import { compose, renameKeys } from 'ramda';

import { transformTxInfo } from '../../_common/transformTxInfo';

export default (compose as any)(
  transformTxInfo,
  renameKeys({
    asset_id: 'assetId',
    min_sponsored_asset_fee: 'minSponsoredAssetFee',
  }),
) as (obj: any) => any;
