import { compose } from 'ramda';

import { createSql } from '../../../_common/sql';
import { SORT } from '../../../_common/sql/defaults';
import { sort } from '../../../_common/sql/filters';
import { filters, filtersOrder } from './filters';
import { select, selectFromFiltered } from './query';

const queryAfterFilters = {
  get: selectFromFiltered(SORT),
  mget: selectFromFiltered(SORT),
  search: (q: any, fValues: any) =>
    compose(
      // outer sort
      sort(fValues.sort),
      // inner sort for row_number() subquery
      selectFromFiltered(fValues.sort),
    )(q),
};

export default createSql({
  filters,
  filtersOrder,
  query: select,
  queryAfterFilters,
});
