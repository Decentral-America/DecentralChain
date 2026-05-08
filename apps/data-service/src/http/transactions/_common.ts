import { Effect, Either, pipe } from 'effect';
import { Hono } from 'hono';
import { ParseError } from '../../errorHandling';
import { type ServiceMesh } from '../../services';
import { type WithLimit, type WithSortOrder } from '../../services/_common';
import {
  type ServiceGetRequest,
  type ServiceMgetRequest,
  type Transaction,
  type TransactionInfo,
  transaction,
} from '../../types';
import { createHttpHandler } from '../_common';
import { parseFilterValues, withDefaults } from '../_common/filters';
import { type Parser } from '../_common/filters/types';
import { postToGet } from '../_common/postToGet';
import {
  get as getSerializer,
  mget as mgetSerializer,
  search as searchSerializer,
} from '../_common/serialize';
import { type AppEnv, type HttpRequest } from '../_common/types';

export const isMgetRequest = (req: unknown): req is ServiceMgetRequest =>
  typeof req === 'object' && req !== null && 'ids' in req;

export const parseGet = ({
  params,
}: HttpRequest<['id']>): Either.Either<ServiceGetRequest, ParseError> => {
  if (params?.id) {
    return Either.right({
      id: params.id,
    });
  } else {
    return Either.left(new ParseError(new Error('TransactionId is required')));
  }
};

export const parseMgetOrSearch =
  <SearchRequest>(customFilters: Record<string, Parser<any>>) =>
  ({ query }: HttpRequest): Either.Either<ServiceMgetRequest | SearchRequest, ParseError> => {
    if (!query) {
      return Either.left(new ParseError(new Error('Query is empty')));
    }

    return pipe(
      parseFilterValues(customFilters)(query as Record<string, string | undefined>),
      Either.map((fValues) => {
        if (isMgetRequest(fValues)) {
          return fValues;
        } else {
          return withDefaults(fValues as SearchRequest);
        }
      }),
    );
  };

export const createTransactionHttpHandlers = <SearchRequest extends WithSortOrder & WithLimit>(
  prefix: string,
  service: ServiceMesh['transactions'][keyof ServiceMesh['transactions']],
  parseRequest: {
    get: (req: HttpRequest<['id']>) => Either.Either<ServiceGetRequest, ParseError>;
    mgetOrSearch: (
      req: HttpRequest<string[]>,
    ) => Either.Either<ServiceMgetRequest | SearchRequest, ParseError>;
  },
) => {
  const mgetOrSearchHandler = createHttpHandler(
    (req, lsnFormat) =>
      isMgetRequest(req)
        ? pipe(
            service.mget(req),
            Effect.map(mgetSerializer<TransactionInfo | null, Transaction>(transaction, lsnFormat)),
          )
        : pipe(
            service.search(req),
            Effect.map(
              searchSerializer<TransactionInfo | null, Transaction>(transaction, lsnFormat),
            ),
          ),
    parseRequest.mgetOrSearch,
  );

  const router = new Hono<AppEnv>();
  router.get(
    `${prefix}/:id`,
    createHttpHandler(
      (req, lsnFormat) =>
        pipe(
          service.get(req),
          Effect.map(getSerializer<TransactionInfo | null, Transaction>(transaction, lsnFormat)),
        ),
      parseRequest.get,
    ),
  );
  router.get(prefix, mgetOrSearchHandler);
  router.post(prefix, postToGet(mgetOrSearchHandler));
  return router;
};
