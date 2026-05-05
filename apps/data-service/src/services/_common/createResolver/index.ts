import { type Task, of as taskOf } from 'folktale/concurrency/task';
import { type Maybe } from 'folktale/maybe';
import { type Result } from 'folktale/result';
import { resultToTask } from '../../../utils/fp';
// @hack because of ramda 'tap' not working with null values
// https://github.com/ramda/ramda/issues/2421
// @todo refactor after ramda fix
import { tap } from '../../../utils/tap';

import { applyValidation } from './applyToResult';

export { applyTransformation } from './applyToResult';

import {
  type AppError,
  type DbError,
  type ResolverError,
  type Timeout,
  type ValidationError,
} from '../../../errorHandling';
import { type SearchedItems } from '../../../types';
import {
  type EmitEvent,
  type GetResolverDependencies,
  type MgetResolverDependencies,
  type SearchResolverDependencies,
  type ValidateSync,
} from './types';

const createResolver = <RequestRaw, RequestTransformed, ResponseRaw, ResponseTransformed>(
  transformInput: (r: RequestRaw) => Result<ValidationError, RequestTransformed>,
  getData: (r: RequestTransformed) => Task<DbError | Timeout, ResponseRaw>,
  validateAllResults: ValidateSync<ResolverError, ResponseRaw>,
  transformAllResults: (response: ResponseRaw, request: RequestRaw) => ResponseTransformed,
  emitEvent: EmitEvent,
  request: RequestRaw,
): Task<AppError, ResponseTransformed> =>
  taskOf<never, RequestRaw>(request)
    .map(transformInput)
    .chain(resultToTask)
    .map(tap(emitEvent('TRANSFORM_INPUT_OK')))
    .chain(getData)
    .map(tap(emitEvent('DB_QUERY_OK')))
    .map(validateAllResults)
    .chain(resultToTask)
    .map(tap(emitEvent('RESULT_VALIDATION_OK')))
    .map((result: ResponseRaw) => transformAllResults(result, request))
    .map(tap(emitEvent('TRANSFORM_RESULT_OK')));

const getResolver =
  <RequestRaw, RequestTransformed, ResponseRaw, ResponseTransformed>(
    dependencies: GetResolverDependencies<
      RequestRaw,
      RequestTransformed,
      ResponseRaw,
      ResponseTransformed
    >,
  ) =>
  (request: RequestRaw): Task<AppError, Maybe<ResponseTransformed>> =>
    createResolver<RequestRaw, RequestTransformed, Maybe<ResponseRaw>, Maybe<ResponseTransformed>>(
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
  (request: RequestRaw) =>
    createResolver<
      RequestRaw,
      RequestTransformed,
      Maybe<ResponseRaw>[],
      Maybe<ResponseTransformed>[]
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
  (request: RequestRaw) =>
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
