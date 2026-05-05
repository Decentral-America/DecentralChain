import { propEq } from 'ramda';

import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { transformTxInfo } from '../../_common/transformTxInfo';

import { result as resultSchema } from './schema';
import * as sql from './sql';
import {
  type AliasTx,
  type AliasTxDbResponse,
  type AliasTxsRepo,
  type AliasTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): AliasTxsRepo => {
  return {
    get: getByIdPreset({
      name: 'transactions.alias.get',
      resultSchema,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset({
      matchRequestResult: propEq('id'),
      name: 'transactions.alias.mget',
      resultSchema,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, AliasTxsSearchRequest, AliasTxDbResponse, AliasTx>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.alias.search',
      resultSchema,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
