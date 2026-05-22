import { createSql } from '../../../../_common/sql';
import { filters, filtersOrder } from './filters';
import { select, selectFromFiltered } from './query';

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
