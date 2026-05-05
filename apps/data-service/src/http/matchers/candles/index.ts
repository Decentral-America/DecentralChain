import Router from '@koa/router';
import { Effect, pipe } from 'effect';
import { type CandlesService } from '../../../services/candles';
import { createHttpHandler } from '../../_common';
import { serialize } from '../../candles/serialize';
import { parse } from './parse';

const subrouter: Router = new Router();

export default ({ search }: CandlesService): Router =>
  subrouter.get(
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
