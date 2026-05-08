import { compose, renameKeys } from 'ramda';

import { transformTxInfo } from '../../_common/transformTxInfo';

export default (compose as any)(
  transformTxInfo,
  renameKeys({
    asset_id: 'assetId',
    asset_name: 'name',
  }),
) as (obj: any) => any;
