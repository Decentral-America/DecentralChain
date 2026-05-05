import { type RepoSearch } from '../../../../../types';
import { type WithLimit, type WithSortOrder } from '../../../../_common';
import { search } from '../../../createResolver';
import { type CursorSerialization, type RequestWithCursor } from '../../../pagination';
import { type RepoPresetInitOptions } from '../../types';
import { validateResult } from '../../validation';
import { getData } from './pg';
import { transformInput } from './transformInput';
import { transformResults } from './transformResults';

export const searchPreset =
  <
    Cursor,
    Request extends RequestWithCursor<WithLimit & WithSortOrder, any>,
    ResponseRaw,
    ResponseTransformed,
  >({
    name,
    sql,
    resultSchema,
    transformResult,
    cursorSerialization,
  }: {
    name: string;
    sql: (r: RequestWithCursor<Request, Cursor>) => string;
    resultSchema: any;
    transformResult: (response: ResponseRaw, request?: Request) => ResponseTransformed;
    cursorSerialization: CursorSerialization<
      Cursor,
      RequestWithCursor<Request, string>,
      ResponseRaw
    >;
  }) =>
  ({
    pg,
    emitEvent,
  }: RepoPresetInitOptions): RepoSearch<
    RequestWithCursor<Request, string>,
    ResponseTransformed
  >['search'] =>
    search<
      RequestWithCursor<Request, string>,
      RequestWithCursor<Request, Cursor>,
      ResponseRaw,
      ResponseTransformed
    >({
      emitEvent,
      getData: getData<Request, ResponseRaw>({
        name,
        pg,
        sql,
      }),
      transformInput: transformInput(cursorSerialization.deserialize),
      transformResult: transformResults<
        Cursor,
        RequestWithCursor<Request, string>,
        ResponseRaw,
        ResponseTransformed
      >(transformResult, cursorSerialization.serialize),
      validateResult: validateResult(resultSchema, name),
    });
