import { propEq } from 'ramda';

import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';

import { result } from './schema';
import * as sql from './sql';
import transformTxInfo from './transformTxInfo';
import {
  type ExchangeTx,
  type ExchangeTxDbResponse,
  type ExchangeTxsRepo,
  type ExchangeTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): ExchangeTxsRepo => {
  return {
    get: getByIdPreset({
      name: 'transactions.exchange.get',
      resultSchema: result,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset({
      matchRequestResult: propEq('id'),
      name: 'transactions.exchange.mget',
      resultSchema: result,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, ExchangeTxsSearchRequest, ExchangeTxDbResponse, ExchangeTx>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.exchange.search',
      resultSchema: result,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
