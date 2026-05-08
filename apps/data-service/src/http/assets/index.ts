import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import {
  type AssetsService,
  type AssetsServiceMgetRequest,
  type AssetsServiceSearchRequest,
} from '../../services/assets';
import { asset } from '../../types';
import { createHttpHandler } from '../_common';
import { postToGet } from '../_common/postToGet';
import {
  get as serializeGet,
  mget as serializeMget,
  search as serializeSearch,
} from '../_common/serialize';
import { type AppEnv } from '../_common/types';
import { get as parseGet, mgetOrSearch as parseMgetOrSearch } from './parse';

const isMgetRequest = (
  req: AssetsServiceMgetRequest | AssetsServiceSearchRequest,
): req is AssetsServiceMgetRequest => 'ids' in req && Array.isArray(req.ids);

const mgetOrSearchHandler = (assetsService: AssetsService) =>
  createHttpHandler(
    (req, lsnFormat) =>
      isMgetRequest(req)
        ? pipe(assetsService.mget(req), Effect.map(serializeMget(asset, lsnFormat)))
        : pipe(assetsService.search(req), Effect.map(serializeSearch(asset, lsnFormat))),
    parseMgetOrSearch,
  );

export default (assetsService: AssetsService) => {
  const app = new Hono<AppEnv>();
  app.get(
    '/assets/:id',
    createHttpHandler(
      (req, lsnFormat) => pipe(assetsService.get(req), Effect.map(serializeGet(asset, lsnFormat))),
      parseGet,
    ),
  );
  app.get('/assets', mgetOrSearchHandler(assetsService));
  app.post('/assets', postToGet(mgetOrSearchHandler(assetsService)));
  return app;
};
