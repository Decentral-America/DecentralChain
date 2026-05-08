import { type AliasInfo, type Repo, type XOR } from '../../../types';

import { type CommonRepoDependencies } from '../..';
import { type WithLimit, type WithSortOrder } from '../../_common';
import { type RequestWithCursor } from '../../_common/pagination';
import { getByIdPreset } from '../../_common/presets/pg/getById';
import { mgetByIdsPreset } from '../../_common/presets/pg/mgetByIds';
import { searchPreset } from '../../_common/presets/pg/search';

import { type Cursor, deserialize, serialize } from './cursor';
import sql from './data/sql';
import { type AliasDbResponse, transformDbResponse } from './data/transformResult';
import { output } from './schema';

export type AliasesGetRequest = string;
export type AliasesMgetRequest = string[];

export type WithAddress = { address: string };
export type WithAddresses = { addresses: string[] };
export type WithQueries = { queries: string[] };

type BaseAliasesSearchRequest = RequestWithCursor<
  WithSortOrder &
    WithLimit & {
      showBroken: boolean;
    },
  string
>;

export type AliasesSearchRequest = BaseAliasesSearchRequest &
  XOR<WithAddress, XOR<WithAddresses, WithQueries>>;

export type AliasesRepo = Repo<
  AliasesGetRequest,
  AliasesMgetRequest,
  AliasesSearchRequest,
  AliasInfo
>;

export default ({ drivers, emitEvent }: CommonRepoDependencies): AliasesRepo => {
  return {
    get: getByIdPreset<AliasesGetRequest, AliasDbResponse, AliasInfo>({
      name: 'aliases.get',
      resultSchema: output as any,
      sql: sql.get,
      transformResult: transformDbResponse as any,
    })({
      emitEvent: emitEvent,
      pg: drivers.pg,
    }),

    mget: mgetByIdsPreset<string, AliasDbResponse, AliasInfo>({
      matchRequestResult: (req, res: any) => res.alias === req,
      name: 'aliases.mget',
      resultSchema: output as any,
      sql: sql.mget,
      transformResult: transformDbResponse as any,
    })({
      emitEvent: emitEvent,
      pg: drivers.pg,
    }),

    search: searchPreset<Cursor, AliasesSearchRequest, AliasDbResponse, AliasInfo>({
      cursorSerialization: {
        deserialize,
        serialize: serialize as any,
      },
      name: 'aliases.search',
      resultSchema: output as any,
      sql: sql.search,
      transformResult: transformDbResponse as any,
    })({
      emitEvent: emitEvent,
      pg: drivers.pg,
    }),
  };
};
