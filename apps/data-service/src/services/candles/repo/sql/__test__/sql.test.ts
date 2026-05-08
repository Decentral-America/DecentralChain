import { Either } from 'effect';
import { interval as intervalFromString } from '../../../../../types/interval';
import { sql } from '../sql';

describe('sql query from candles', () => {
  it('should search candles for 1h', () => {
    expect(
      sql.search({
        amountAsset: '111',
        interval: Either.getOrThrow(intervalFromString('1h')),
        matcher: '123',
        priceAsset: '222',
        timeEnd: new Date('2017-04-03T23:59:59.999Z'),
        timeStart: new Date('2017-04-03T00:00:00.000Z'),
      }),
    ).toMatchSnapshot();
  });

  it('should search candles for 1d', () => {
    expect(
      sql.search({
        amountAsset: '111',
        interval: Either.getOrThrow(intervalFromString('1d')),
        matcher: '123',
        priceAsset: '222',
        timeEnd: new Date('2017-04-03T23:59:59.999Z'),
        timeStart: new Date('2017-04-03T00:00:00.000Z'),
      }),
    ).toMatchSnapshot();
  });

  it('should search candles for 1m', () => {
    expect(
      sql.search({
        amountAsset: '111',
        interval: Either.getOrThrow(intervalFromString('1m')),
        matcher: '123',
        priceAsset: '222',
        timeEnd: new Date('2017-04-03T23:59:59.999Z'),
        timeStart: new Date('2017-04-03T00:00:00.000Z'),
      }),
    ).toMatchSnapshot();
  });
});
