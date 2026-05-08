import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import { type CandlesService } from '../../../services/candles';
import { createHttpHandler } from '../../_common';
import { type AppEnv } from '../../_common/types';
import { serialize } from '../../candles/serialize';
import { parse } from './parse';

export default ({ search }: CandlesService) => {
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
  return app;
};
