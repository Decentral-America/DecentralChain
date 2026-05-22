import { renameKeys } from 'ramda';

import { transformTxInfo } from '../../_common/transformTxInfo';

type TxRow = Record<string, unknown>;

const _transform = (obj: TxRow): TxRow => {
  const step1 = renameKeys({ asset_id: 'assetId', asset_name: 'name' }, obj) as TxRow;
  return transformTxInfo(step1);
};

export default _transform as (obj: TxRow) => any;
