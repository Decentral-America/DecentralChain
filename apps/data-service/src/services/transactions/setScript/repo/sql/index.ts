import { createSql } from '../../../_common/sql';

import { select, selectFromFiltered } from './query';
import { filters, filtersOrder } from './filters';

const queryAfterFilters = {
  get: selectFromFiltered,
  mget: selectFromFiltered,
  search: selectFromFiltered,
};

export default createSql({
  filters,
  filtersOrder,
  query: select,
  queryAfterFilters,
});
