import { renameKeys } from 'ramda';

import { type CommonTransactionInfo } from '../../../../types';

export const transformTxInfo = renameKeys<CommonTransactionInfo>({
  time_stamp: 'timestamp',
  tx_type: 'type',
  uid: 'txUid',
});
