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
  type ReissueTx,
  type ReissueTxDbResponse,
  type ReissueTxsRepo,
  type ReissueTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): ReissueTxsRepo => {
  return {
    get: getByIdPreset<string, ReissueTxDbResponse, ReissueTx>({
      name: 'transactions.reissue.get',
      resultSchema: resultSchema as any,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, ReissueTxDbResponse, ReissueTx>({
      matchRequestResult: propEq('id') as any,
      name: 'transactions.reissue.mget',
      resultSchema: resultSchema as any,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, ReissueTxsSearchRequest, ReissueTxDbResponse, ReissueTx>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.reissue.search',
      resultSchema: resultSchema as any,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
