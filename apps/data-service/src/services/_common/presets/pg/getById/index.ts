import { Either } from 'effect';
import { get as getResolver } from '../../../createResolver';
import { type RepoPresetInitOptions } from '../../types';
import { validateResult } from '../../validation';
import { getData } from './pg';
import { transformResults as transformResultFn } from './transformResult';

export const getByIdPreset =
  <Id, ResponseRaw, ResponseTransformed>({
    name,
    sql,
    resultSchema,
    transformResult,
  }: {
    name: string;
    resultSchema: any;
    transformResult: (response: ResponseRaw, request?: Id) => ResponseTransformed;
    sql: (r: Id) => string;
  }) =>
  ({ pg, emitEvent }: RepoPresetInitOptions) =>
    getResolver<Id, Id, ResponseRaw, ResponseTransformed>({
      emitEvent,
      getData: getData({ name, pg, sql }),
      transformInput: (r) => Either.right(r),
      transformResult: transformResultFn<Id, ResponseRaw, ResponseTransformed>(transformResult),
      validateResult: validateResult(resultSchema, name),
    });
