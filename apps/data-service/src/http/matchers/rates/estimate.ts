import { Effect, pipe } from 'effect';
import { type RatesMgetService } from '../../../services/rates';
import { createHttpHandler } from '../../_common';
import { parse } from './parse';
import { serialize } from './serialize';

export default (service: RatesMgetService) =>
  createHttpHandler(
    (req, lsnFormat) =>
      pipe(
        service(req),
        Effect.map((res) => serialize(res, lsnFormat)),
      ),
    parse,
  );
