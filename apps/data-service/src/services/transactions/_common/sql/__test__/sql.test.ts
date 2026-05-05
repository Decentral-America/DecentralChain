import { knex as _knex } from 'knex';
const pg = _knex({ client: 'pg' });

import { createSql } from '..';

// sample query
const query = pg('some_table').select('*');
const filterValues = {
  limit: 1,
  sender: 'sender',
  sort: 'desc',
  timeEnd: new Date('2020-02-01'),
  timeStart: new Date('2020-01-01'),
};

const sql = createSql({ query });

describe('Sql builder', () => {
  describe('search', () => {
    it('covers case with all filters (without after)', () => {
      expect(sql.search(filterValues)).toMatchSnapshot();
    });
    it('covers case with all filters with after', () => {
      expect(
        sql.search({
          ...filterValues,
          after: {
            sort: 'sortDirection',
            uid: 20000000,
          },
        }),
      ).toMatchSnapshot();
    });
  });
  describe(' get', () => {
    it('works', () => {
      expect(sql.get('id')).toMatchSnapshot();
    });
  });
  describe('mget', () => {
    it('works', () => {
      expect(sql.mget(['id1', 'id2'])).toMatchSnapshot();
    });
  });
});
