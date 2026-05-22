import { assoc, pick, pipe } from 'ramda';

import { pickBindFilters } from '../../../../../../utils/db';
import * as defaultValues from '../../../../_common/sql/defaults';
import { select, selectFromFiltered } from './query';

// one — get by id
// many — apply filters
export default ({ filters: F }: { filters: any }) => ({
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
      // tips for postgresql to use index
      F.sort(defaultValues.SORT),
      F.limit(ids.length),
      selectFromFiltered,
      String,
    )(select),

  search: (fValues: any = {}) => {
    const fNames = [
      'after',
      // tx attributes
      'timeStart',
      'timeEnd',
      'blockTimeStart',
      'blockTimeEnd',
      'sender',
      'senders',
      // data attributes
      'key',
      'type',
      'value',
      // common
      'sort',
      'limit',
    ];

    // { [fName]: fValue }
    const withDefaults = pick(fNames, { ...defaultValues, ...fValues }) as Record<string, unknown>;

    const withValueF =
      withDefaults['value'] !== undefined ? assoc('value', F.value(withDefaults['type']), F) : F;

    const fs: any[] = pickBindFilters(
      withValueF,
      // filter by type+value or type
      withDefaults['value'] !== undefined ? fNames.filter((name) => name !== 'type') : fNames,
      withDefaults,
    );

    const filtered: any = fs.reduce((q: any, f: any) => f(q), select);
    return String(F.sort(withDefaults['sort'])(selectFromFiltered(filtered)));
  },
});
