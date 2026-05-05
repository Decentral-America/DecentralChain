import { Effect, Either, pipe } from 'effect';
import { type Context } from 'koa';
import { type AppError, type ParseError, ResolverError } from '../../errorHandling';
import { type WithMoneyFormat } from '../../services/types';
import { eitherToEffect } from '../../utils/fp';
import { handleError } from '../_common/handleError';
import { type LSNFormat } from '../types';
import { type HttpRequest, type HttpResponse } from './types';
import {
  contentTypeWithMoneyFormat,
  parseLSNFormat,
  parseMoneyFormat,
  setHttpResponse,
} from './utils';

export function createHttpHandler<_Params extends string[], _Request>(
  getResponse: (
    request: WithMoneyFormat,
    lsnFormat: LSNFormat,
  ) => Effect.Effect<HttpResponse, AppError>,
): (ctx: Context) => Promise<void>;
export function createHttpHandler<Params extends string[], Request>(
  getResponse: (
    request: Request & WithMoneyFormat,
    lsnFormat: LSNFormat,
  ) => Effect.Effect<HttpResponse, AppError>,
  parseRequest: (httpRequest: HttpRequest<Params>) => Either.Either<Request, ParseError>,
): (ctx: Context) => Promise<void>;
export function createHttpHandler<Params extends string[], Request>(
  getResponse: (
    req: WithMoneyFormat | (Request & WithMoneyFormat),
    lsnFormat: LSNFormat,
  ) => Effect.Effect<HttpResponse, AppError>,
  parseRequest?: (httpRequest: HttpRequest<Params>) => Either.Either<Request, ParseError>,
): (ctx: Context) => Promise<void> {
  return async (ctx: Context): Promise<void> => {
    ctx['eventBus'].emit('ENDPOINT_HIT', { value: ctx.originalUrl });

    const setResponse = setHttpResponse(ctx);
    const safeParse = parseRequest ?? (() => Either.right(undefined as unknown as Request));

    try {
      await pipe(
        eitherToEffect(
          safeParse({
            headers: ctx.headers,
            params: ctx['params'],
            query: ctx.query as Record<string, string>,
          }),
        ),
        Effect.flatMap((req) =>
          pipe(
            eitherToEffect(parseMoneyFormat(ctx.headers)),
            Effect.map((moneyFormat) => ({ ...req, moneyFormat })),
          ),
        ),
        Effect.flatMap((req) =>
          pipe(
            eitherToEffect(parseLSNFormat(ctx.headers)),
            Effect.flatMap((lsnFormat) =>
              pipe(
                getResponse(req, lsnFormat),
                Effect.map((response) => ({ request: req, response })),
              ),
            ),
          ),
        ),
        Effect.match({
          onFailure: (e: AppError) => {
            ctx['eventBus'].emit('ERROR', e);
            setResponse(handleError(e));
          },
          onSuccess: (dto) => {
            setResponse(
              dto.response.withHeaders({
                'Content-Type':
                  typeof dto.response.headers !== 'undefined' &&
                  dto.response.headers['Content-Type'] !== 'undefined'
                    ? contentTypeWithMoneyFormat(
                        dto.request.moneyFormat,
                        dto.response.headers['Content-Type'],
                      )
                    : contentTypeWithMoneyFormat(dto.request.moneyFormat),
              }),
            );
          },
        }),
        Effect.runPromise,
      ).catch((e: unknown) => {
        const err = new ResolverError(e as string | Error);
        ctx['eventBus'].emit('ERROR', err);
        setResponse(handleError(err));
      });
    } catch (e) {
      const err = new ResolverError(e as string | Error);
      ctx['eventBus'].emit('ERROR', err);
      setResponse(handleError(err));
    }

    ctx['eventBus'].emit('ENDPOINT_RESOLVED', { value: ctx.body });
  };
}
