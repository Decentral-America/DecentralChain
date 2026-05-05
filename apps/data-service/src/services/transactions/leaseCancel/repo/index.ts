import { propEq } from 'ramda';

import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';

import { result as resultSchema } from './schema';
import * as sql from './sql';
import * as transformTxInfo from './transformTxInfo';
import {
  type LeaseCancelTx,
  type LeaseCancelTxDbResponse,
  type LeaseCancelTxsRepo,
  type LeaseCancelTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): LeaseCancelTxsRepo => {
  return {
    get: getByIdPreset({
      name: 'transactions.leaseCancel.get',
      resultSchema,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset({
      matchRequestResult: propEq('id'),
      name: 'transactions.leaseCancel.mget',
      resultSchema,
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
      resultSchema,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
