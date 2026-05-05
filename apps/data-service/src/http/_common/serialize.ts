import { type Option } from 'effect';
import { list, type SearchedItems, type Serializable } from '../../types';
import { stringify } from '../../utils/json';
import { LSNFormat } from '../types';
import { HttpResponse } from './types';
import { contentTypeWithLSN } from './utils';

export const get =
  <T extends R, Res extends Serializable<string, R | null>, R = T>(
    toSerializable: (t: T | null) => Res,
    lsnFormat: LSNFormat = LSNFormat.String,
  ) =>
  (m: Option.Option<T>): HttpResponse =>
    m._tag === 'Some'
      ? HttpResponse.Ok(stringify(lsnFormat)(toSerializable(m.value))).withHeaders({
          'Content-Type': contentTypeWithLSN(lsnFormat),
        })
      : HttpResponse.NotFound();

export const mget =
  <T extends R, Res extends Serializable<string, R | null>, R = T>(
    toSerializable: (t: T | null) => Res,
    lsnFormat: LSNFormat = LSNFormat.String,
  ) =>
  (ms: Option.Option<T>[]): HttpResponse =>
    HttpResponse.Ok(
      stringify(lsnFormat)(
        list(ms.map((m) => (m._tag === 'Some' ? toSerializable(m.value) : toSerializable(null)))),
      ),
    ).withHeaders({ 'Content-Type': contentTypeWithLSN(lsnFormat) });

export const search =
  <T extends R, Res extends Serializable<string, R | null>, R = T>(
    toSerializable: (t: T | null) => Res,
    lsnFormat: LSNFormat = LSNFormat.String,
  ) =>
  (data: SearchedItems<T>): HttpResponse =>
    HttpResponse.Ok(
      stringify(lsnFormat)(
        list(
          data.items.map((a) => toSerializable(a)),
          { isLastPage: data.isLastPage, lastCursor: data.lastCursor },
        ),
      ),
    ).withHeaders({ 'Content-Type': contentTypeWithLSN(lsnFormat) });
