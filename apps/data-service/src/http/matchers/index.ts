import { Hono } from 'hono';
import { type CandlesService } from '../../services/candles';
import { type PairsService } from '../../services/pairs';
import { type RatesMgetService } from '../../services/rates';
import { type AppEnv } from '../_common/types';
import createCandles from './candles';
import createPairs from './pairs';
import createRates from './rates';

export default ({
  pairs,
  candles,
  rates,
}: {
  pairs: PairsService;
  candles: CandlesService;
  rates: RatesMgetService;
}) => {
  const app = new Hono<AppEnv>();
  app.route('/', createPairs(pairs));
  app.route('/', createCandles(candles));
  app.route('/', createRates(rates));
  return app;
};
