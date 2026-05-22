import { isNil, reject } from 'ramda';

import { transformTxInfo } from '../../_common/transformTxInfo';

type TxRow = Record<string, unknown>;

const _transform = (obj: TxRow): TxRow => {
  const step1 = reject(isNil, obj) as TxRow;
  return transformTxInfo(step1);
};

export default _transform as (obj: TxRow) => any;
