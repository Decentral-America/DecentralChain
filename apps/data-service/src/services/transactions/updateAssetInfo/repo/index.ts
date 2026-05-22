import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';
import { result as resultSchema } from './schema';
import sql from './sql';
import transformTxInfo from './transformTxInfo';
import {
  type UpdateAssetInfoTx,
  type UpdateAssetInfoTxDbResponse,
  type UpdateAssetInfoTxsRepo,
  type UpdateAssetInfoTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): UpdateAssetInfoTxsRepo => {
  return {
    get: getByIdPreset<string, UpdateAssetInfoTxDbResponse, UpdateAssetInfoTx>({
      name: 'transactions.updateAssetInfo.get',
      resultSchema: resultSchema,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, UpdateAssetInfoTxDbResponse, UpdateAssetInfoTx>({
      matchRequestResult: (req, res: any) => res.id === req,
      name: 'transactions.updateAssetInfo.mget',
      resultSchema: resultSchema,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<
      Cursor,
      UpdateAssetInfoTxsSearchRequest,
      UpdateAssetInfoTxDbResponse,
      UpdateAssetInfoTx
    >({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.updateAssetInfo.search',
      resultSchema: resultSchema,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
