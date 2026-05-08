import { compose, renameKeys } from 'ramda';

import { transformTxInfo } from '../../_common/transformTxInfo';

export default (compose as any)(transformTxInfo, renameKeys({ lease_id: 'leaseId' })) as (
  obj: any,
) => any;
