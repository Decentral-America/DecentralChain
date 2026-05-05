import { Ok as ok } from 'folktale/result';

import { type CommonRepoDependencies } from '../../..';

import { get, mget, search } from '../../../_common/createResolver';
// transformation
import { transformResults as transformResultGet } from '../../../_common/presets/pg/getById/transformResult';
import { transformResults as transformResultMget } from '../../../_common/presets/pg/mgetByIds/transformResult';
import { transformInput as transformInputSearch } from '../../../_common/presets/pg/search/transformInput';
import { transformResults as transformResultSearch } from '../../../_common/presets/pg/search/transformResults';
// validation
import { validateResult } from '../../../_common/presets/validation';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { pg as pgData } from './pg';
import { result as resultSchema } from './schema';
import * as transformTxInfo from './transformTxInfo';
import {
  type DataTx,
  type DataTxDbResponse,
  type DataTxsGetRequest,
  type DataTxsRepo,
  type DataTxsSearchRequest,
} from './types';

const createServiceName = (type: string): string => `transactions.data.${type}`;

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): DataTxsRepo => {
  return {
    get: get({
      emitEvent,
      getData: pgData.get(pg),
      transformInput: ok,
      transformResult: transformResultGet<DataTxsGetRequest, DataTxDbResponse, DataTx>(
        transformTxInfo,
      ),
      validateResult: validateResult(resultSchema, createServiceName('get')),
    }),

    mget: mget({
      emitEvent,
      getData: pgData.mget(pg),
      transformInput: ok,
      transformResult: transformResultMget<string[], DataTxDbResponse, DataTx>(transformTxInfo),
      validateResult: validateResult(resultSchema, createServiceName('mget')),
    }),

    search: search<DataTxsSearchRequest, DataTxsSearchRequest<Cursor>, DataTxDbResponse, DataTx>({
      emitEvent,
      getData: pgData.search(pg),
      transformInput: transformInputSearch(deserialize),
      transformResult: transformResultSearch(transformTxInfo, serialize),
      validateResult: validateResult(resultSchema, createServiceName('search')),
    }),
  };
};
