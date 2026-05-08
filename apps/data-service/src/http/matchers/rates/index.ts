import { Hono } from 'hono';
import { type RatesMgetService } from '../../../services/rates';
import { postToGet } from '../../_common/postToGet';
import { type AppEnv } from '../../_common/types';
import getEstimateRateHandler from './estimate';

export default (rateService: RatesMgetService) => {
  const app = new Hono<AppEnv>();
  app.get('/rates', getEstimateRateHandler(rateService));
  app.post('/rates', postToGet(getEstimateRateHandler(rateService)));
  return app;
};
