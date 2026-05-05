import * as Router from '@koa/router';
import { type CandlesService } from '../../services/candles';
import { type PairsService } from '../../services/pairs';
import { type RatesMgetService } from '../../services/rates';
import createCandles from './candles';
import createPairs from './pairs';
import createRates from './rates';

const subrouter = new Router({ prefix: '/matchers/:matcher' });

export default ({
  pairs,
  candles,
  rates,
}: {
  pairs: PairsService;
  candles: CandlesService;
  rates: RatesMgetService;
}) =>
  subrouter
    .use(createPairs(pairs).routes())
    .use(createCandles(candles).routes())
    .use(createRates(rates).routes());
