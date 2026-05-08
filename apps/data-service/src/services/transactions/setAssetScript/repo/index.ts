import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';

import { result } from './schema';
import sql from './sql';
import transformTxInfo from './transformTxInfo';
import {
  type SetAssetScriptTx,
  type SetAssetScriptTxDbResponse,
  type SetAssetScriptTxsRepo,
  type SetAssetScriptTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): SetAssetScriptTxsRepo => {
  return {
    get: getByIdPreset<string, SetAssetScriptTxDbResponse, SetAssetScriptTx>({
      name: 'transactions.setAssetScript.get',
      resultSchema: result,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, SetAssetScriptTxDbResponse, SetAssetScriptTx>({
      matchRequestResult: (req, res: any) => res.id === req,
      name: 'transactions.setAssetScript.mget',
      resultSchema: result,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<
      Cursor,
      SetAssetScriptTxsSearchRequest,
      SetAssetScriptTxDbResponse,
      SetAssetScriptTx
    >({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.setAssetScript.search',
      resultSchema: result,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
