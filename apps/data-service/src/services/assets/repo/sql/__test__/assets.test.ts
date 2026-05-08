import { get, mget, search } from '../';

describe('Assets SQL queries tests', () => {
  it('should build correct get sql query', () => {
    expect(get('123')).toMatchSnapshot();
  });

  it('should build correct mget sql query', () => {
    expect(mget(['1', '2', '3'])).toMatchSnapshot();
  });

  it('should build correct search sql query', () => {
    expect(search({ ticker: '*' } as any)).toMatchSnapshot();
  });

  it('should build correct search sql query', () => {
    expect(search({ ticker: 'BTC' } as any)).toMatchSnapshot();
  });

  it('should build correct search sql query', () => {
    expect(search({ search: 'WAVES' } as any)).toMatchSnapshot();
  });

  it('should build correct search sql query', () => {
    expect(search({ search: 'bitcoin cas' } as any)).toMatchSnapshot();
  });

  it('should build correct search sql query', () => {
    expect(
      search({
        after: 'FiKAykpjAFkiukke7ZpVX511HHumPZYKyu6GXokPEkcT',
        limit: 3,
        search: 'BIT',
      } as any),
    ).toMatchSnapshot();
  });
});
