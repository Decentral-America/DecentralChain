// @ts-nocheck
import { propEq } from 'ramda';

import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { transformTxInfo } from '../../_common/transformTxInfo';

import { result as resultSchema } from './schema';
import sql from './sql';
import {
  type PaymentTx,
  type PaymentTxDbResponse,
  type PaymentTxsRepo,
  type PaymentTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): PaymentTxsRepo => {
  return {
    get: getByIdPreset<string, PaymentTxDbResponse, PaymentTx>({
      name: 'transactions.payment.get',
      resultSchema: resultSchema as any,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, PaymentTxDbResponse, PaymentTx>({
      matchRequestResult: propEq('id') as any,
      name: 'transactions.payment.mget',
      resultSchema: resultSchema as any,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, PaymentTxsSearchRequest, PaymentTxDbResponse, PaymentTx>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.payment.search',
      resultSchema: resultSchema as any,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
