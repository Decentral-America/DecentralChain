// @ts-nocheck
import { propEq } from 'ramda';

import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';

import { result as resultSchema } from './schema';
import sql from './sql';
import transformTxInfo from './transformTxInfo';
import {
  type IssueTx,
  type IssueTxDbResponse,
  type IssueTxsRepo,
  type IssueTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): IssueTxsRepo => {
  return {
    get: getByIdPreset<string, IssueTxDbResponse, IssueTx>({
      name: 'transactions.issue.get',
      resultSchema: resultSchema as any,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, IssueTxDbResponse, IssueTx>({
      matchRequestResult: propEq('id') as any,
      name: 'transactions.issue.mget',
      resultSchema: resultSchema as any,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, IssueTxsSearchRequest, IssueTxDbResponse, IssueTx>({
      cursorSerialization: { deserialize, serialize },
      name: 'transactions.issue.search',
      resultSchema: resultSchema as any,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
