import sql from '../sql';

const filterValues = [
  {
    script: 'base64:somescript',
  },
  {
    assetId: 'DCC',
  },
  {
    assetId: 'DCC',
    script: 'base64:somescript',
  },
];

describe('Sql search by type-specific filters', () => {
  it('supports script filter', () => {
    expect(sql.search(filterValues[0] as any)).toMatchSnapshot();
  });

  it('supports assetId filter', () => {
    expect(sql.search(filterValues[1] as any)).toMatchSnapshot();
  });

  it('supports assetId and script filters', () => {
    expect(sql.search(filterValues[2] as any)).toMatchSnapshot();
  });
});
