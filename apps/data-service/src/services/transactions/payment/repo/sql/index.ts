import { compose } from 'ramda';

import { createSql } from '../../../_common/sql';
import { sort } from '../../../_common/sql/filters';
import { SORT } from '../../../_common/sql/defaults';

import { select, selectFromFiltered } from './query';
import { filters, filtersOrder } from './filters';

const queryAfterFilters = {
  // get, mget does not has sort value
  get: selectFromFiltered(SORT),
  mget: selectFromFiltered(SORT),
  search: (q, fValues) => compose(sort(fValues.sort), selectFromFiltered(fValues.sort))(q),
};

export default createSql({
  filters,
  filtersOrder,
  query: select,
  queryAfterFilters,
});
