import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { transformTxInfo } from '../../_common/transformTxInfo';

import { result as resultSchema } from './schema';
import sql from './sql';
import {
  type GenesisTx,
  type GenesisTxDbResponse,
  type GenesisTxsRepo,
  type GenesisTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): GenesisTxsRepo => {
  return {
    get: getByIdPreset<string, GenesisTxDbResponse, GenesisTx>({
      name: 'transactions.genesis.get',
      resultSchema: resultSchema,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, GenesisTxDbResponse, GenesisTx>({
      matchRequestResult: (req, res: any) => res.id === req,
      name: 'transactions.genesis.mget',
      resultSchema: resultSchema,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, GenesisTxsSearchRequest, GenesisTxDbResponse, GenesisTx>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.genesis.search',
      resultSchema: resultSchema,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
