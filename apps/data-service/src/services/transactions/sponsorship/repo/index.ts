import { type CommonRepoDependencies } from '../../..';
import { getByIdPreset } from '../../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from '../../_common/cursor';

import { result as resultSchema } from './schema';
import sql from './sql';
import transformTxInfo from './transformTxInfo';
import {
  type SponsorshipTx,
  type SponsorshipTxDbResponse,
  type SponsorshipTxsRepo,
  type SponsorshipTxsSearchRequest,
} from './types';

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): SponsorshipTxsRepo => {
  return {
    get: getByIdPreset<string, SponsorshipTxDbResponse, SponsorshipTx>({
      name: 'transactions.sponsorship.get',
      resultSchema: resultSchema,
      sql: sql.get,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    mget: mgetByIdsPreset<string, SponsorshipTxDbResponse, SponsorshipTx>({
      matchRequestResult: (req, res: any) => res.id === req,
      name: 'transactions.sponsorship.mget',
      resultSchema: resultSchema,
      sql: sql.mget,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),

    search: searchPreset<
      Cursor,
      SponsorshipTxsSearchRequest,
      SponsorshipTxDbResponse,
      SponsorshipTx
    >({
      cursorSerialization: {
        deserialize,
        serialize,
      },
      name: 'transactions.sponsorship.search',
      resultSchema: resultSchema,
      sql: sql.search,
      transformResult: transformTxInfo,
    })({
      emitEvent,
      pg,
    }),
  };
};
