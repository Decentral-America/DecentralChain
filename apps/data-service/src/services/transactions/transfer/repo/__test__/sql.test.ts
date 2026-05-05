import sql from '../sql';

const filterValues = {
  assetId: 'someAssetID',
  recipient: 'recipient',
};

test('Sql search supports type-specific filters', () => {
  expect(sql.search(filterValues)).toMatchSnapshot();
});
