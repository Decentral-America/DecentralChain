import { Hono } from 'hono';
import { type ServiceMesh } from '../../services';
import commonFilters from '../_common/filters/filters';
import { type Parser } from '../_common/filters/types';
import { type AppEnv } from '../_common/types';
import { createTransactionHttpHandlers, parseGet, parseMgetOrSearch } from './_common';
import { parseDataMgetOrSearch } from './parseDataMgetOrSearch';

const createParseRequest = <SearchRequest>(customFilters: Record<string, Parser<any>> = {}) => ({
  get: parseGet,
  mgetOrSearch: parseMgetOrSearch<SearchRequest>(customFilters),
});

export default (txsServices: ServiceMesh['transactions']) => {
  const all = createTransactionHttpHandlers(
    '/transactions/all',
    txsServices.all,
    createParseRequest(),
  );

  const genesis = createTransactionHttpHandlers(
    '/transactions/genesis',
    txsServices.genesis,
    createParseRequest({ recipient: commonFilters.query }),
  );

  const payment = createTransactionHttpHandlers(
    '/transactions/payment',
    txsServices.payment,
    createParseRequest({ recipient: commonFilters.query }),
  );

  const issue = createTransactionHttpHandlers(
    '/transactions/issue',
    txsServices.issue,
    createParseRequest({ assetId: commonFilters.query, script: commonFilters.query }),
  );

  const transfer = createTransactionHttpHandlers(
    '/transactions/transfer',
    txsServices.transfer,
    createParseRequest({ assetId: commonFilters.query, recipient: commonFilters.query }),
  );

  const reissue = createTransactionHttpHandlers(
    '/transactions/reissue',
    txsServices.reissue,
    createParseRequest({ assetId: commonFilters.query }),
  );

  const burn = createTransactionHttpHandlers(
    '/transactions/burn',
    txsServices.burn,
    createParseRequest({ assetId: commonFilters.query }),
  );

  const exchange = createTransactionHttpHandlers(
    '/transactions/exchange',
    txsServices.exchange,
    createParseRequest({
      amountAsset: commonFilters.query,
      matcher: commonFilters.query,
      orderId: commonFilters.query,
      priceAsset: commonFilters.query,
    }),
  );

  const lease = createTransactionHttpHandlers(
    '/transactions/lease',
    txsServices.lease,
    createParseRequest({ recipient: commonFilters.query }),
  );

  const leaseCancel = createTransactionHttpHandlers(
    '/transactions/lease-cancel',
    txsServices.leaseCancel,
    createParseRequest({ recipient: commonFilters.query }),
  );

  const alias = createTransactionHttpHandlers(
    '/transactions/alias',
    txsServices.alias,
    createParseRequest(),
  );

  const massTransfer = createTransactionHttpHandlers(
    '/transactions/mass-transfer',
    txsServices.massTransfer,
    createParseRequest({ assetId: commonFilters.query, recipient: commonFilters.query }),
  );

  const data = createTransactionHttpHandlers('/transactions/data', txsServices.data, {
    get: parseGet,
    mgetOrSearch: parseDataMgetOrSearch,
  });

  const setScript = createTransactionHttpHandlers(
    '/transactions/set-script',
    txsServices.setScript,
    createParseRequest({ script: commonFilters.query }),
  );

  const sponsorship = createTransactionHttpHandlers(
    '/transactions/sponsorship',
    txsServices.sponsorship,
    createParseRequest({ assetId: commonFilters.query }),
  );

  const setAssetScript = createTransactionHttpHandlers(
    '/transactions/set-asset-script',
    txsServices.setAssetScript,
    createParseRequest({ assetId: commonFilters.query, script: commonFilters.query }),
  );

  const invokeScript = createTransactionHttpHandlers(
    '/transactions/invoke-script',
    txsServices.invokeScript,
    createParseRequest({ dapp: commonFilters.query, function: commonFilters.query }),
  );

  const updateAssetInfo = createTransactionHttpHandlers(
    '/transactions/update-asset-info',
    txsServices.updateAssetInfo,
    createParseRequest({ assetId: commonFilters.query }),
  );

  const ethereumLike = createTransactionHttpHandlers(
    '/transactions/ethereum-like',
    txsServices.ethereumLike,
    createParseRequest({ function: commonFilters.query, type: commonFilters.query }),
  );

  const app = new Hono<AppEnv>();
  app.route('/', alias);
  app.route('/', all);
  app.route('/', burn);
  app.route('/', data);
  app.route('/', exchange);
  app.route('/', genesis);
  app.route('/', invokeScript);
  app.route('/', issue);
  app.route('/', lease);
  app.route('/', leaseCancel);
  app.route('/', massTransfer);
  app.route('/', payment);
  app.route('/', reissue);
  app.route('/', setAssetScript);
  app.route('/', setScript);
  app.route('/', sponsorship);
  app.route('/', transfer);
  app.route('/', updateAssetInfo);
  app.route('/', ethereumLike);
  return app;
};
