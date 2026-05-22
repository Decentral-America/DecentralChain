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
      resultSchema: resultSchema,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, PaymentTxDbResponse, PaymentTx>({
      matchRequestResult: (req, res: any) => res.id === req,
      name: 'transactions.payment.mget',
      resultSchema: resultSchema,
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
      resultSchema: resultSchema,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
