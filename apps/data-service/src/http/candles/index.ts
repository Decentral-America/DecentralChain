import Router from '@koa/router';
import { Effect, pipe } from 'effect';
import { type CandlesService } from '../../services/candles';
import { createHttpHandler } from '../_common';
import { parse } from './parse';
import { serialize, serializeCandleInfo } from './serialize';

const subrouter: Router = new Router();

export default ({ search, searchLast }: CandlesService): Router =>
  subrouter
    .get(
      '/candles/:amountAsset/:priceAsset',
      createHttpHandler(
        (req, lsnFormat) =>
          pipe(
            search(req),
            Effect.map((res) => serialize(res, lsnFormat)),
          ),
        parse,
      ),
    )
    .get(
      '/last_candle/:amountAsset/:priceAsset',
      createHttpHandler(
        (req, lsnFormat) =>
          pipe(
            searchLast(req),
            Effect.map((res) => serializeCandleInfo(res, lsnFormat)),
          ),
        parse,
      ),
    );
