import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { transformTxInfo } from '../../_common/transformTxInfo';

import { result as resultSchema } from './schema';
import sql from './sql';
import {
  type AliasTx,
  type AliasTxDbResponse,
  type AliasTxsRepo,
  type AliasTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): AliasTxsRepo => {
  return {
    get: getByIdPreset<string, AliasTxDbResponse, AliasTx>({
      name: 'transactions.alias.get',
      resultSchema: resultSchema,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, AliasTxDbResponse, AliasTx>({
      matchRequestResult: (req, res: any) => res.id === req,
      name: 'transactions.alias.mget',
      resultSchema: resultSchema,
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
      resultSchema: resultSchema,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
