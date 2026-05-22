import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { result as resultSchema } from './schema';
import sql from './sql';
import transformTxInfo from './transformTxInfo';
import {
  type EthereumLikeTx,
  type EthereumLikeTxDbResponse,
  type EthereumLikeTxsRepo,
  type EthereumLikeTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): EthereumLikeTxsRepo => {
  return {
    get: getByIdPreset<string, EthereumLikeTxDbResponse, EthereumLikeTx>({
      name: 'transactions.ethereumLike.get',
      resultSchema: resultSchema,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, EthereumLikeTxDbResponse, EthereumLikeTx>({
      matchRequestResult: (req, res: any) => res.id === req,
      name: 'transactions.ethereumLike.mget',
      resultSchema: resultSchema,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<
      Cursor,
      EthereumLikeTxsSearchRequest,
      EthereumLikeTxDbResponse,
      EthereumLikeTx
    >({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.ethereumLike.search',
      resultSchema: resultSchema,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
