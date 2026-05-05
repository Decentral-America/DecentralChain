// @ts-nocheck
import { propEq } from 'ramda';

import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { transformTxInfo } from '../../_common/transformTxInfo';

import { result } from './schema';
import sql from './sql';
import {
  type SetScriptTx,
  type SetScriptTxDbResponse,
  type SetScriptTxsRepo,
  type SetScriptTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): SetScriptTxsRepo => {
  return {
    get: getByIdPreset<string, SetScriptTxDbResponse, SetScriptTx>({
      name: 'transactions.setScript.get',
      resultSchema: result,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, SetScriptTxDbResponse, SetScriptTx>({
      matchRequestResult: propEq('id') as any,
      name: 'transactions.setScript.mget',
      resultSchema: result,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, SetScriptTxsSearchRequest, SetScriptTxDbResponse, SetScriptTx>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.setScript.search',
      resultSchema: result,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
