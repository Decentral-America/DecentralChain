import { Effect, type Option, pipe } from 'effect';
import {
  type AppError,
  type DbError,
  type ResolverError,
  type Timeout,
  type ValidationError,
} from '../../../errorHandling';
import { type SearchedItems } from '../../../types';
import { eitherToEffect } from '../../../utils/fp';
import { tap } from '../../../utils/tap';
import { applyValidation } from './applyToResult';
import {
  type EmitEvent,
  type GetResolverDependencies,
  type MgetResolverDependencies,
  type SearchResolverDependencies,
  type ValidateSync,
} from './types';

export { applyTransformation } from './applyToResult';

const createResolver = <RequestRaw, RequestTransformed, ResponseRaw, ResponseTransformed>(
  transformInput: (
    r: RequestRaw,
  ) => import('effect').Either.Either<RequestTransformed, ValidationError>,
  getData: (r: RequestTransformed) => Effect.Effect<ResponseRaw, DbError | Timeout>,
  validateAllResults: ValidateSync<ResolverError, ResponseRaw>,
  transformAllResults: (response: ResponseRaw, request: RequestRaw) => ResponseTransformed,
  emitEvent: EmitEvent,
  request: RequestRaw,
): Effect.Effect<ResponseTransformed, AppError> =>
  pipe(
    eitherToEffect(transformInput(request)),
    Effect.tap(tap(emitEvent('TRANSFORM_INPUT_OK'))),
    Effect.flatMap(getData),
    Effect.tap(tap(emitEvent('DB_QUERY_OK'))),
    Effect.flatMap((raw) => eitherToEffect(validateAllResults(raw))),
    Effect.tap(tap(emitEvent('RESULT_VALIDATION_OK'))),
    Effect.map((result) => transformAllResults(result, request)),
    Effect.tap(tap(emitEvent('TRANSFORM_RESULT_OK'))),
  ) as unknown as Effect.Effect<ResponseTransformed, AppError>;

const getResolver =
  <RequestRaw, RequestTransformed, ResponseRaw, ResponseTransformed>(
    dependencies: GetResolverDependencies<
      RequestRaw,
      RequestTransformed,
      ResponseRaw,
      ResponseTransformed
    >,
  ) =>
  (request: RequestRaw): Effect.Effect<Option.Option<ResponseTransformed>, AppError> =>
    createResolver<
      RequestRaw,
      RequestTransformed,
      Option.Option<ResponseRaw>,
      Option.Option<ResponseTransformed>
    >(
      dependencies.transformInput,
      dependencies.getData,
      applyValidation.get(dependencies.validateResult),
      (result) => dependencies.transformResult(result, request),
      dependencies.emitEvent,
      request,
    );

const mgetResolver =
  <RequestRaw, RequestTransformed, ResponseRaw, ResponseTransformed>(
    dependencies: MgetResolverDependencies<
      RequestRaw,
      RequestTransformed,
      ResponseRaw,
      ResponseTransformed
    >,
  ) =>
  (request: RequestRaw): Effect.Effect<Option.Option<ResponseTransformed>[], AppError> =>
    createResolver<
      RequestRaw,
      RequestTransformed,
      Option.Option<ResponseRaw>[],
      Option.Option<ResponseTransformed>[]
    >(
      dependencies.transformInput,
      dependencies.getData,
      applyValidation.mget(dependencies.validateResult),
      (result) => dependencies.transformResult(result, request),
      dependencies.emitEvent,
      request,
    );

const searchResolver =
  <RequestRaw, RequestTransformed, ResponseRaw, ResponseTransformed>(
    dependencies: SearchResolverDependencies<
      RequestRaw,
      RequestTransformed,
      ResponseRaw,
      ResponseTransformed
    >,
  ) =>
  (request: RequestRaw): Effect.Effect<SearchedItems<ResponseTransformed>, AppError> =>
    createResolver<
      RequestRaw,
      RequestTransformed,
      ResponseRaw[],
      SearchedItems<ResponseTransformed>
    >(
      dependencies.transformInput,
      dependencies.getData,
      applyValidation.search(dependencies.validateResult),
      (result) => dependencies.transformResult(result, request),
      dependencies.emitEvent,
      request,
    );

export const get = getResolver;
export const mget = mgetResolver;
export const search = searchResolver;
