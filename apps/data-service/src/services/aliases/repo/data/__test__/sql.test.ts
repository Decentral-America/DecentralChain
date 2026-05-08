import sql from '../sql';

describe('Alias sql query build', () => {
  it('`one` should build select by alias', () => {
    expect(sql.get('scam')).toMatchSnapshot();
  });

  it('`many` should build select by address with order by time and hide blocked by default', () => {
    expect(sql.search({ address: '3PELiu6JuVMLJojenRkTPTzCRjAocrxXWJy' } as any)).toMatchSnapshot();
  });

  it('`many` should build select by address with order by time and show blocked if flag is set', () => {
    expect(
      sql.search({
        address: '3PELiu6JuVMLJojenRkTPTzCRjAocrxXWJy',
        showBroken: true,
      } as any),
    ).toMatchSnapshot();
  });
});
