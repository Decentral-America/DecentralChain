import { Either } from 'effect';
import { mget } from '../../../createResolver';
import { type RepoPresetInitOptions } from '../../types';
import { validateResult } from '../../validation';
import { getData } from './pg';
import { transformResults as transformResultsFn } from './transformResult';

export const mgetByIdsPreset =
  <Id, ResponseRaw, ResponseTransformed>({
    name,
    sql,
    resultSchema,
    matchRequestResult,
    transformResult,
  }: {
    name: string;
    resultSchema: any;
    transformResult: (response: ResponseRaw, request?: Id[]) => ResponseTransformed;
    sql: (r: Id[]) => string;
    matchRequestResult: (req: Id, res: ResponseRaw) => boolean;
  }) =>
  ({ pg, emitEvent }: RepoPresetInitOptions) =>
    mget<Id[], Id[], ResponseRaw, ResponseTransformed>({
      emitEvent,
      getData: getData<ResponseRaw, Id>({
        matchRequestResult,
        name,
        pg,
        sql,
      }),
      transformInput: (r) => Either.right(r),
      transformResult: transformResultsFn(transformResult),
      validateResult: validateResult<ResponseRaw>(resultSchema, name),
    });
