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
  type LeaseCancelTx,
  type LeaseCancelTxDbResponse,
  type LeaseCancelTxsRepo,
  type LeaseCancelTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): LeaseCancelTxsRepo => {
  return {
    get: getByIdPreset<string, LeaseCancelTxDbResponse, LeaseCancelTx>({
      name: 'transactions.leaseCancel.get',
      resultSchema: resultSchema as any,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, LeaseCancelTxDbResponse, LeaseCancelTx>({
      matchRequestResult: propEq('id') as any,
      name: 'transactions.leaseCancel.mget',
      resultSchema: resultSchema as any,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<
      Cursor,
      LeaseCancelTxsSearchRequest,
      LeaseCancelTxDbResponse,
      LeaseCancelTx
    >({
      cursorSerialization: { deserialize, serialize },
      name: 'transactions.leaseCancel.search',
      resultSchema: resultSchema as any,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
