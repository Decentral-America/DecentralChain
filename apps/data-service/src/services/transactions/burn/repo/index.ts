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
  type BurnTx,
  type BurnTxDbResponse,
  type BurnTxsRepo,
  type BurnTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): BurnTxsRepo => {
  return {
    get: getByIdPreset<string, BurnTxDbResponse, BurnTx>({
      name: 'transactions.burn.get',
      resultSchema: resultSchema as any,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, BurnTxDbResponse, BurnTx>({
      matchRequestResult: propEq('id') as any,
      name: 'transactions.burn.mget',
      resultSchema: resultSchema as any,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, BurnTxsSearchRequest, BurnTxDbResponse, BurnTx>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.burn.search',
      resultSchema: resultSchema as any,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
