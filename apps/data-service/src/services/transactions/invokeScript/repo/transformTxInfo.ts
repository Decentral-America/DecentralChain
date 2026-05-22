import { isNil, reject, renameKeys } from 'ramda';
import { transformTxInfo } from '../../_common/transformTxInfo';

type TxRow = Record<string, unknown>;

const _transform = (obj: TxRow): TxRow => {
  const step1 = reject(isNil, obj) as TxRow;
  const step2 = renameKeys<Record<string, unknown>>(
    { dapp: 'dApp', fee_asset_id: 'feeAssetId' },
    step1,
  ) as TxRow;
  return transformTxInfo(step2);
};

export default _transform as (obj: TxRow) => any;
