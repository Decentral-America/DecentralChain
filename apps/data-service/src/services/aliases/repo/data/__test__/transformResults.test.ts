import { transformDbResponse as transformResult } from '../transformResult';

describe('sql query results transformation', () => {
  it('alias with one address (duplicates equals to 0)', () => {
    expect(transformResult({ address: 'qwerty', alias: 'qwerty', duplicates: 0 })).toEqual({
      address: 'qwerty',
      alias: 'qwerty',
    });
  });

  it('alias with many addresses (duplicates more then 0)', () => {
    expect(transformResult({ address: 'qwerty', alias: 'qwerty', duplicates: 2 })).toEqual({
      address: null,
      alias: 'qwerty',
    });
  });
});
