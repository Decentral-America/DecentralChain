import { of as taskOf } from 'folktale/concurrency/task';

import { createPgDriver } from '../../../../db';
import { loadConfig } from '../../../../loadConfig';

const options = loadConfig();
import create from '..';

const amountAsset = '8dzLYRNtYR6ASG2W4h3FqeeY49paRxNheQwRW6CpP1HT';
const priceAsset = '4zjSCagDvgPkTCwFjvE4KMFtXz1WX4dNaNutyBw8XnrG';

describe('Candles', () => {
  const service = create({
    drivers: { pg: createPgDriver(options) },
    emitEvent: () => () => null,
    validatePairs: () => taskOf(undefined),
  });

  describe('search all candles between 2017-05-26 00:00:00 and 2017-05-26 23:59:59', () => {
    it('should return all Candles correctly for each 1h', (done) => {
      service
        .search({
          amountAsset,
          interval: '1h',
          matcher: options.matcher.defaultMatcherAddress,
          priceAsset,
          timeEnd: new Date('2017-05-26T23:59:59.999Z'),
          timeStart: new Date('2017-05-26T00:00:00.000Z'),
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
          timeEnd: new Date('2017-05-26T23:59:59.999Z'),
          timeStart: new Date('2017-05-26T00:00:00.000Z'),
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
