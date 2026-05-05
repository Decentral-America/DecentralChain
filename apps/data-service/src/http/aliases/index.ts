import Router from '@koa/router';
import { Effect, pipe } from 'effect';
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
import { get as parseGet, mgetOrSearch as parseMgetOrSearch } from './parse';

const subrouter: Router = new Router();

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

export default (aliasesService: AliasesService): Router => {
  return subrouter
    .get(
      '/aliases/:id',
      createHttpHandler(
        (req) => pipe(aliasesService.get(req), Effect.map(getSerializer(alias))),
        parseGet,
      ),
    )
    .get('/aliases', mgetOrSearchHandler(aliasesService))
    .post('/aliases', postToGet(mgetOrSearchHandler(aliasesService)));
};
