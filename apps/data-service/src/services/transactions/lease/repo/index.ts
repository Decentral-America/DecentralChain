import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { transformTxInfo } from '../../_common/transformTxInfo';

import { result as resultSchema } from './schema';
import sql from './sql';
import {
  type LeaseTx,
  type LeaseTxDbResponse,
  type LeaseTxsRepo,
  type LeaseTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): LeaseTxsRepo => {
  return {
    get: getByIdPreset<string, LeaseTxDbResponse, LeaseTx>({
      name: 'transactions.lease.get',
      resultSchema: resultSchema,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, LeaseTxDbResponse, LeaseTx>({
      matchRequestResult: (req, res: any) => res.id === req,
      name: 'transactions.lease.mget',
      resultSchema: resultSchema,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, LeaseTxsSearchRequest, LeaseTxDbResponse, LeaseTx>({
      cursorSerialization: { deserialize, serialize },
      name: 'transactions.lease.search',
      resultSchema: resultSchema,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
