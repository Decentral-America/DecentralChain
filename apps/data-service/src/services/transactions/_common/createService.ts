import { type Task } from 'folktale/concurrency/task';
import { type Maybe } from 'folktale/maybe';
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
  get: (req: ServiceGetRequest) => Task<AppError, Maybe<Response>>;
  mget: (req: ServiceMgetRequest) => Task<AppError, Maybe<Response>[]>;
  search: (req: ServiceSearchRequest) => Task<AppError, SearchedItems<Response>>;
} => ({
  get: (req: ServiceGetRequest) => repo.get(req.id),
  mget: (req: ServiceMgetRequest) => repo.mget(req.ids),
  search: (req: ServiceSearchRequest) => repo.search(req),
});
