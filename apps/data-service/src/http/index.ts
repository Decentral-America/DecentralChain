import { Hono } from 'hono';
import { type PgDriver } from '../db/driver';
import { type ServiceMesh } from '../services';
import { type AppEnv } from './_common/types';
import aliases from './aliases';
import assets from './assets';
import candles from './candles';
import health from './health';
import matchers from './matchers';
import notFound from './notFound';
import pairs from './pairs';
import { createReadinessHandler } from './readiness';
import root from './root';
import transactions from './transactions';
import version from './version';

export default (serviceMesh: ServiceMesh, pgDriver: PgDriver) => {
  const app = new Hono<AppEnv>();

  app.route('/', aliases(serviceMesh.aliases));
  app.route('/', assets(serviceMesh.assets));
  app.route('/', candles(serviceMesh.candles));
  app.route('/matchers/:matcher', matchers(serviceMesh.matchers));
  app.route('/', pairs(serviceMesh.pairs));
  app.route('/', transactions(serviceMesh.transactions));
  app.get('/health', health);
  app.get('/readiness', createReadinessHandler(pgDriver));
  app.get('/version', version);
  app.get('/', root);
  app.get('*', notFound);

  return app;
};
