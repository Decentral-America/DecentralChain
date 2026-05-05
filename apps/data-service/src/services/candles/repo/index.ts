import { type Task } from 'folktale/concurrency/task';
import { Ok as ok } from 'folktale/result';
import { type AppError } from '../../../errorHandling';
import {
  type CandleInfo,
  type Interval,
  type RepoSearch,
  type RepoSearchResponse,
} from '../../../types';
import { type CommonRepoDependencies } from '../..';
import { search } from '../../_common/createResolver';
import { getData } from '../../_common/presets/pg/search/pg';
import { validateResult } from '../../_common/presets/validation';
import { output } from './schema';
import { sql } from './sql';
import { transformLastResult, transformResults } from './transformResults';

export type CandlesSearchRequest = {
  amountAsset: string;
  priceAsset: string;
  timeStart: Date;
  timeEnd: Date;
  interval: Interval;
  matcher: string;
};

export type RepoSearchLast<Request, Response> = {
  readonly searchLast: (request: Request) => Task<AppError, RepoSearchResponse<Response>>;
};

export type CandlesRepo = RepoSearch<CandlesSearchRequest, CandleInfo> &
  RepoSearchLast<CandlesSearchRequest, CandleInfo>;

export default ({ drivers: { pg }, emitEvent }: CommonRepoDependencies): CandlesRepo => {
  const SERVICE__SEARCH__NAME = 'candles.search';
  const SERVICE__SEARCH_LAST__NAME = 'candles.search_last';
  return {
    search: search({
      emitEvent,
      getData: getData({
        name: SERVICE__SEARCH__NAME,
        pg,
        sql: sql.search,
      }),
      transformInput: ok,
      transformResult: transformResults,
      validateResult: validateResult(output, SERVICE__SEARCH__NAME),
    }),
    searchLast: search({
      emitEvent,
      getData: getData({
        name: SERVICE__SEARCH_LAST__NAME,
        pg,
        sql: sql.searchLast,
      }),
      transformInput: ok,
      transformResult: transformLastResult,
      validateResult: validateResult(output, SERVICE__SEARCH_LAST__NAME),
    }),
  };
};
