import { defaultTo, pick, pipe } from 'ramda';

import { pickBindFilters } from '../../../../../../utils/db';
import * as defaultValues from '../../../../_common/sql/defaults';
import { select, selectFromFiltered } from './query';

// get — get by id
// mget/search — apply filters
const createApi = ({ filters: F }: { filters: any }) => ({
  get: (id: any) =>
    pipe(
      F.id(id),
      // tip for postgresql to use index
      F.limit(1),
      selectFromFiltered,
      String,
    )(select(defaultValues.SORT)),

  mget: (ids: any) =>
    pipe(
      F.ids(ids),
      // tip for postgresql to use index
      F.limit(ids.length),
      selectFromFiltered,
      String,
    )(select(defaultValues.SORT)),

  search: (fValues: any) => {
    const fNames = [
      // tx attributes
      'after',
      'timeStart',
      'timeEnd',
      'blockTimeStart',
      'blockTimeEnd',
      'sender',
      'senders',
      // specific attributes
      'dapp',
      'function',
      // limit
      'limit',
    ];

    // { [fName]: fValue }
    const withDefaults = pick(fNames, { ...defaultValues, ...fValues }) as Record<string, unknown>;

    const sort = defaultTo(defaultValues.SORT, fValues.sort);

    const fs: any[] = pickBindFilters(F, fNames, withDefaults);

    const filtered: any = fs.reduce((q: any, f: any) => f(q), select(sort));
    return String(F.sort(sort)(selectFromFiltered(filtered)));
  },
});

export { createApi };
