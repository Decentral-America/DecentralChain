import { Either } from 'effect';
import { type CommonRepoDependencies } from '../../..';
import { get, mget, search } from '../../../_common/createResolver';
import { transformResults as transformResultGet } from '../../../_common/presets/pg/getById/transformResult';
import { transformResults as transformResultMget } from '../../../_common/presets/pg/mgetByIds/transformResult';
import { transformInput as transformInputSearch } from '../../../_common/presets/pg/search/transformInput';
import { transformResults as transformResultSearch } from '../../../_common/presets/pg/search/transformResults';
import { validateResult } from '../../../_common/presets/validation';
import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import pgData from './pg';
import { result as resultSchema } from './schema';
import transformTxInfo from './transformTxInfo';
import {
  type InvokeScriptTx,
  type InvokeScriptTxsRepo,
  type InvokeScriptTxsSearchRequest,
  type RawInvokeScriptTx,
} from './types';

const createServiceName = (type: string) => `transactions.invokeScript.${type}`;

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): InvokeScriptTxsRepo => {
  return {
    get: get({
      emitEvent,
      getData: pgData.get(pg),
      transformInput: (r) => Either.right(r),
      transformResult: transformResultGet(transformTxInfo),
      validateResult: validateResult<RawInvokeScriptTx>(resultSchema, createServiceName('get')),
    }),

    mget: mget({
      emitEvent,
      getData: pgData.mget(pg),
      transformInput: (r) => Either.right(r),
      transformResult: transformResultMget(transformTxInfo),
      validateResult: validateResult(resultSchema, createServiceName('mget')),
    }),

    search: search<
      InvokeScriptTxsSearchRequest,
      InvokeScriptTxsSearchRequest<Cursor>,
      RawInvokeScriptTx,
      InvokeScriptTx
    >({
      emitEvent,
      getData: pgData.search(pg),
      transformInput: transformInputSearch(deserialize),
      transformResult: transformResultSearch<
        Cursor,
        InvokeScriptTxsSearchRequest,
        RawInvokeScriptTx,
        InvokeScriptTx
      >(transformTxInfo, serialize),
      validateResult: validateResult<RawInvokeScriptTx>(resultSchema, createServiceName('search')),
    }),
  };
};
