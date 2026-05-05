import sql from '../sql';

const filterValues = {
  amountAsset: 'amountAsset',
  matcher: 'matcher',
  priceAsset: 'priceAsset',
  sender: 'sender',
};

test('Sql search supports type-specific filters', () => {
  expect(sql.search(filterValues)).toMatchSnapshot();
});
