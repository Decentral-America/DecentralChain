import { defaultTo, pick, pipe } from 'ramda';

import { pickBindFilters } from '../../../../../utils/db';
import * as defaultValues from '../../../_common/sql/defaults';
import { select, selectFromFiltered } from './query';

// get — get by id
// mget/search — apply filters
const createApi = ({ filters: F }: { filters: any }) => ({
  get: (id: any) =>
    pipe(
      F.id(id),
      // tips for postgresql to use index
      F.limit(1),
      selectFromFiltered,
      String,
    )(select),

  mget: (ids: any) =>
    pipe(
      F.ids(ids),
      // tip for postgresql to use index
      F.sort(defaultValues.SORT),
      F.limit(ids.length),
      selectFromFiltered,
      String,
    )(select),

  search: (fValues: any) => {
    const fNames = [
      // tx attributes
      'timeStart',
      'timeEnd',
      'blockTimeStart',
      'blockTimeEnd',
      // specific attributes
      'matcher',
      'orderId',
      'amountAsset',
      'priceAsset',
      // common
      'limit',
      'sort',
      'after',
      // have to be the last one
      'sender',
      'senders',
    ];

    // { [fName]: fValue }
    const withDefaults = pick(fNames, fValues);

    const sort = defaultTo(defaultValues.SORT, fValues.sort);

    const fs: any[] = pickBindFilters(F, fNames, withDefaults) as unknown as any[];

    const filtered: any = fs.reduce((q: any, f: any) => f(q), select);
    return String(F.sort(sort)(F.limit(fValues.limit)(selectFromFiltered(filtered))));
  },
});

export { createApi };
