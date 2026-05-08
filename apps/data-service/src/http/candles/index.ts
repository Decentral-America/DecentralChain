import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import { type CandlesService } from '../../services/candles';
import { createHttpHandler } from '../_common';
import { type AppEnv } from '../_common/types';
import { parse } from './parse';
import { serialize, serializeCandleInfo } from './serialize';

export default ({ search, searchLast }: CandlesService) => {
  const app = new Hono<AppEnv>();
  app.get(
    '/candles/:amountAsset/:priceAsset',
    createHttpHandler(
      (req, lsnFormat) =>
        pipe(
          search(req),
          Effect.map((res) => serialize(res, lsnFormat)),
        ),
      parse,
    ),
  );
  app.get(
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
  return app;
};
