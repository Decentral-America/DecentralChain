import { type IncomingHttpHeaders } from 'node:http';
import { Effect, Either, pipe } from 'effect';
import { parse as qsParse } from 'qs';
import { type AppError, type ParseError, ResolverError } from '../../errorHandling';
import { type WithMoneyFormat } from '../../services/types';
import { type ValuesOf } from '../../types/generic';
import { eitherToEffect } from '../../utils/fp';
import { handleError } from '../_common/handleError';
import { type LSNFormat } from '../types';
import { type AppContext, type HttpRequest, type HttpResponse } from './types';
import { contentTypeWithMoneyFormat, parseLSNFormat, parseMoneyFormat, toResponse } from './utils';

export function createHttpHandler<_Params extends string[], _Request>(
  getResponse: (
    request: WithMoneyFormat,
    lsnFormat: LSNFormat,
  ) => Effect.Effect<HttpResponse, AppError>,
): (c: AppContext) => Promise<Response>;
export function createHttpHandler<Params extends string[], Request>(
  getResponse: (
    request: Request & WithMoneyFormat,
    lsnFormat: LSNFormat,
  ) => Effect.Effect<HttpResponse, AppError>,
  parseRequest: (httpRequest: HttpRequest<Params>) => Either.Either<Request, ParseError>,
): (c: AppContext) => Promise<Response>;
export function createHttpHandler<Params extends string[], Request>(
  getResponse: (
    req: WithMoneyFormat | (Request & WithMoneyFormat),
    lsnFormat: LSNFormat,
  ) => Effect.Effect<HttpResponse, AppError>,
  parseRequest?: (httpRequest: HttpRequest<Params>) => Either.Either<Request, ParseError>,
): (c: AppContext) => Promise<Response> {
  return async (c: AppContext): Promise<Response> => {
    const eventBus = c.get('eventBus');
    eventBus.emit('ENDPOINT_HIT', { value: c.req.url });

    const overrideQuery = c.get('postBodyQuery');
    const rawQs = overrideQuery ?? c.req.url.split('?')[1] ?? '';
    const query = qsParse(rawQs) as Record<string, string | string[]>;

    const headers: IncomingHttpHeaders = {};
    c.req.raw.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const httpRequest: HttpRequest<Params> = {
      headers,
      params: c.req.param() as Record<ValuesOf<Params>, string>,
      query,
    };

    const safeParse = parseRequest ?? (() => Either.right(undefined as unknown as Request));

    let httpResponse: HttpResponse;
    try {
      httpResponse = await pipe(
        eitherToEffect(safeParse(httpRequest)),
        Effect.flatMap((req) =>
          pipe(
            eitherToEffect(parseMoneyFormat(headers)),
            Effect.map((moneyFormat) => ({ ...req, moneyFormat })),
          ),
        ),
        Effect.flatMap((req) =>
          pipe(
            eitherToEffect(parseLSNFormat(headers)),
            Effect.flatMap((lsnFormat) =>
              pipe(
                getResponse(req, lsnFormat),
                Effect.map((response) => ({ lsnFormat, request: req, response })),
              ),
            ),
          ),
        ),
        Effect.matchEffect({
          onFailure: (e: AppError) => {
            eventBus.emit('ERROR', e);
            return Effect.succeed(handleError(e));
          },
          onSuccess: (dto) => {
            const existingCT = dto.response.headers?.['Content-Type'];
            return Effect.succeed(
              dto.response.withHeaders({
                'Content-Type':
                  existingCT !== undefined && existingCT !== 'undefined'
                    ? contentTypeWithMoneyFormat(dto.request.moneyFormat, existingCT)
                    : contentTypeWithMoneyFormat(dto.request.moneyFormat),
              }),
            );
          },
        }),
        Effect.runPromise,
      ).catch((e: unknown) => {
        const err = new ResolverError(e as string | Error);
        eventBus.emit('ERROR', err);
        return handleError(err);
      });
    } catch (e) {
      const err = new ResolverError(e as string | Error);
      eventBus.emit('ERROR', err);
      httpResponse = handleError(err);
    }

    eventBus.emit('ENDPOINT_RESOLVED', { value: httpResponse.body });
    return toResponse(httpResponse);
  };
}
