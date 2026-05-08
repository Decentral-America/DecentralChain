import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import {
  type AliasesService,
  type AliasesServiceMgetRequest,
  type AliasesServiceSearchRequest,
} from '../../services/aliases';
import { alias } from '../../types';
import { createHttpHandler } from '../_common';
import { postToGet } from '../_common/postToGet';
import {
  get as getSerializer,
  mget as mgetSerializer,
  search as searchSerializer,
} from '../_common/serialize';
import { type AppEnv } from '../_common/types';
import { get as parseGet, mgetOrSearch as parseMgetOrSearch } from './parse';

const isMgetRequest = (
  req: AliasesServiceMgetRequest | AliasesServiceSearchRequest,
): req is AliasesServiceMgetRequest => 'aliases' in req && Array.isArray(req.aliases);

const mgetOrSearchHandler = (aliasesService: AliasesService) =>
  createHttpHandler(
    (req) =>
      isMgetRequest(req)
        ? pipe(aliasesService.mget(req), Effect.map(mgetSerializer(alias)))
        : pipe(aliasesService.search(req), Effect.map(searchSerializer(alias))),
    parseMgetOrSearch,
  );

export default (aliasesService: AliasesService) => {
  const app = new Hono<AppEnv>();
  app.get(
    '/aliases/:id',
    createHttpHandler(
      (req) => pipe(aliasesService.get(req), Effect.map(getSerializer(alias))),
      parseGet,
    ),
  );
  app.get('/aliases', mgetOrSearchHandler(aliasesService));
  app.post('/aliases', postToGet(mgetOrSearchHandler(aliasesService)));
  return app;
};
