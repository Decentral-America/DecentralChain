import { Either } from 'effect';
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
import transformTxInfo from './transformTxInfo';
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
      transformInput: (r) => Either.right(r) as any,
      transformResult: transformResultGet<DataTxsGetRequest, DataTxDbResponse, DataTx>(
        transformTxInfo as any,
      ),
      validateResult: validateResult(resultSchema, createServiceName('get')) as any,
    }),

    mget: mget({
      emitEvent,
      getData: pgData.mget(pg) as any,
      transformInput: (r) => Either.right(r) as any,
      transformResult: transformResultMget<string[], DataTxDbResponse, DataTx>(
        transformTxInfo as any,
      ) as any,
      validateResult: validateResult(resultSchema, createServiceName('mget')) as any,
    }),

    search: search<DataTxsSearchRequest, DataTxsSearchRequest<Cursor>, DataTxDbResponse, DataTx>({
      emitEvent,
      getData: pgData.search(pg),
      transformInput: transformInputSearch(deserialize) as any,
      transformResult: transformResultSearch(transformTxInfo as any, serialize),
      validateResult: validateResult(resultSchema, createServiceName('search')) as any,
    }),
  };
};
