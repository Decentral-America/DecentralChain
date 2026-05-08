import { Hono } from 'hono';
import { type ServiceMesh } from '../services';
import { type AppEnv } from './_common/types';
import aliases from './aliases';
import assets from './assets';
import candles from './candles';
import matchers from './matchers';
import notFound from './notFound';
import pairs from './pairs';
import root from './root';
import transactions from './transactions';
import version from './version';

export default (serviceMesh: ServiceMesh) => {
  const app = new Hono<AppEnv>();

  app.route('/', aliases(serviceMesh.aliases));
  app.route('/', assets(serviceMesh.assets));
  app.route('/', candles(serviceMesh.candles));
  app.route('/matchers/:matcher', matchers(serviceMesh.matchers));
  app.route('/', pairs(serviceMesh.pairs));
  app.route('/', transactions(serviceMesh.transactions));
  app.get('/version', version);
  app.get('/', root);
  app.get('*', notFound);

  return app;
};
