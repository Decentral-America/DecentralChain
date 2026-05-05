import sql from '../sql';

const filterValues = {
  script: 'base64:somescript',
};

describe('Sql search by type-specific filters', () => {
  it('supports recipient filter', () => {
    expect(sql.search(filterValues)).toMatchSnapshot();
  });
});
