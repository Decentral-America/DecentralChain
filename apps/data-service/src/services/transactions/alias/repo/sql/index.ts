import { compose } from 'ramda';

import { createSql } from '../../../_common/sql';
import { sort } from '../../../_common/sql/filters';
import { SORT } from '../../../_common/sql/defaults';

import { select, selectFromFiltered } from './query';
import { filters, filtersOrder } from './filters';

const queryAfterFilters = {
  get: selectFromFiltered(SORT),
  mget: selectFromFiltered(SORT),
  search: (q, fValues) =>
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
