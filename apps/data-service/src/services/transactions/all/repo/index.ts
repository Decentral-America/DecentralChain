import { propEq } from 'ramda';

import { type CommonTransactionInfo } from '../../../../types';
import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { result } from './schema';
import sql from './sql';
import { transformTxInfo } from './transformTxInfo';
import {
  type AllTxsGetRequest,
  type AllTxsRepo,
  type AllTxsSearchRequest,
  type TxDbResponse,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): AllTxsRepo => {
  return {
    get: getByIdPreset<AllTxsGetRequest, TxDbResponse, CommonTransactionInfo>({
      name: 'transactions.all.commonData.get',
      resultSchema: result,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, TxDbResponse, CommonTransactionInfo>({
      matchRequestResult: propEq('id'),
      name: 'transactions.all.commonData.mget',
      resultSchema: result,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<Cursor, AllTxsSearchRequest, TxDbResponse, CommonTransactionInfo>({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.all.commonData.search',
      resultSchema: result,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
