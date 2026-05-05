import { compose, isNil, reject } from 'ramda';

import { transformTxInfo } from '../../_common/transformTxInfo';

export default compose(transformTxInfo, reject(isNil));
