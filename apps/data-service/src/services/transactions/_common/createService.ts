import { type Effect, type Option } from 'effect';
import { type AppError } from '../../../errorHandling';
import { type Repo, type SearchedItems } from '../../../types';

export const createService = <
  GetRequest,
  ServiceGetRequest extends { id: GetRequest },
  MgetRequest,
  ServiceMgetRequest extends { ids: MgetRequest },
  SearchRequest,
  ServiceSearchRequest extends SearchRequest,
  Response,
>(
  repo: Repo<GetRequest, MgetRequest, SearchRequest, Response>,
): {
  get: (req: ServiceGetRequest) => Effect.Effect<Option.Option<Response>, AppError>;
  mget: (req: ServiceMgetRequest) => Effect.Effect<Option.Option<Response>[], AppError>;
  search: (req: ServiceSearchRequest) => Effect.Effect<SearchedItems<Response>, AppError>;
} => ({
  get: (req: ServiceGetRequest) => repo.get(req.id),
  mget: (req: ServiceMgetRequest) => repo.mget(req.ids),
  search: (req: ServiceSearchRequest) => repo.search(req),
});
