import { of as taskOf } from 'folktale/concurrency/task';

import { createPgDriver } from '../../../../db';
import { loadConfig } from '../../../../loadConfig';
const options = loadConfig();
import create from '..';

const amountAsset = 'AnERqFRffNVrCbviXbDEdzrU6ipXCP5Y1PKpFdRnyQAy';
const priceAsset = 'WAVES';

describe('Candles', () => {
  const service = create({
    drivers: { pg: createPgDriver(options) },
    emitEvent: () => () => null,
    validatePairs: () => taskOf(undefined),
  });

  describe('search all candles between 2017-04-12 00:00:00 and 2017-04-12 23:59:59', () => {
    it('should return all Candles correctly for each 1h', (done) => {
      service
        .search({
          amountAsset,
          interval: '1h',
          matcher: options.matcher.defaultMatcherAddress,
          priceAsset,
          timeEnd: new Date('2017-04-12T23:59:59.999Z'),
          timeStart: new Date('2017-04-12T00:00:00.000Z'),
        })
        .run()
        .listen({
          onRejected: done.fail,
          onResolved: (value) => {
            expect(value).toMatchSnapshot();
            done();
          },
        });
    });

    it('should return all Candles correctly for each 1d', (done) => {
      service
        .search({
          amountAsset,
          interval: '1d',
          matcher: options.matcher.defaultMatcherAddress,
          priceAsset,
          timeEnd: new Date('2017-04-12T23:59:59.999Z'),
          timeStart: new Date('2017-04-12T00:00:00.000Z'),
        })
        .run()
        .listen({
          onRejected: done.fail,
          onResolved: (value) => {
            expect(value).toMatchSnapshot();
            done();
          },
        });
    });
  });

  describe('search last candle between 2017-04-12 00:00:00 and 2017-04-12 23:59:59', () => {
    it('should return last candle with txs_count != 0 correctly', (done) => {
      service
        .searchLast({
          amountAsset,
          interval: '1d',
          matcher: options.matcher.defaultMatcherAddress,
          priceAsset,
          timeEnd: new Date('2017-05-30T01:00:00.000Z'),
          timeStart: new Date('2017-04-14T00:00:00.000Z'),
        })
        .run()
        .listen({
          onRejected: done.fail,
          onResolved: (value) => {
            expect(value).toMatchSnapshot();
            done();
          },
        });
    });
  });
});
