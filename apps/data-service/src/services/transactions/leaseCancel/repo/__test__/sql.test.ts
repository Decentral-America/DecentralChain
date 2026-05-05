import sql from '../sql';
const filterValues = {
  limit: 100,
  // for test
  recipient: 'recipient',
  // default values
  sort: 'desc',
};

describe('Sql search by type-specific filters', () => {
  it('supports recipient filter', () => {
    expect(sql.search(filterValues)).toMatchSnapshot();
  });
});
