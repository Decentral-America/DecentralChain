import * as Router from '@koa/router';

const router = new Router();

import { type ServiceMesh } from '../services';
import aliases from './aliases';
import assets from './assets';
import candles from './candles';
import matchers from './matchers';
import notFound from './notFound';
import pairs from './pairs';
import root from './root';
import transactions from './transactions';
import version from './version';

export default (serviceMesh: ServiceMesh) =>
  router
    .use(aliases(serviceMesh.aliases).routes())
    .use(assets(serviceMesh.assets).routes())
    .use(candles(serviceMesh.candles).routes())
    .use(matchers(serviceMesh.matchers).routes())
    .use(pairs(serviceMesh.pairs).routes())
    .use(transactions(serviceMesh.transactions).routes())
    .get('/version', version)
    .get('/', root)
    .get('*', notFound);
