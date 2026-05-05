import sql from '..';

const filterValues = {
  assetId: 'assetId',
  recipient: 'recipient',
};

test('Sql search supports type-specific filters', () => {
  expect(sql.default.search(filterValues)).toMatchSnapshot();
});
