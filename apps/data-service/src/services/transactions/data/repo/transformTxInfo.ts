import { compose, isNil, reject } from 'ramda';

import { transformTxInfo } from '../../_common/transformTxInfo';

export default (compose as any)(transformTxInfo, reject(isNil)) as (obj: any) => any;
