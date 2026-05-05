import { knex as _knex } from 'knex';
const pg = _knex({ client: 'pg' });
import { of as taskOf } from 'folktale/concurrency/task';
import { createPgDriver } from '../../../../db';
import { loadConfig } from '../../../../loadConfig';
const options = loadConfig();
const pgDriver = createPgDriver(options);
import create from '..';
import { create as createCache } from '../cache';
import { BigNumber } from '@decentralchain/data-entities';
let pair;

const cache = createCache(1000, 5000);

describe('Pairs', () => {
  const service = create({
    cache,
    drivers: { pg: pgDriver },
    emitEvent: () => () => null,
    validatePairs: () => taskOf(undefined),
  });

  beforeAll(async () => {
    pair = await pgDriver
      .one(
        pg('pairs')
          .select('*')
          .where('matcher', options.matcher.defaultMatcherAddress)
          .limit(1)
          .toString(),
      )
      .run()
      .promise();
  });

  describe('get one pair', () => {
    it('should return Pair for one correctly', async () => {
      const result = (
        await service
          .get({
            matcher: pair.matcher,
            pair: {
              amountAsset: pair.amount_asset_id,
              priceAsset: pair.price_asset_id,
            },
          })
          .run()
          .promise()
      ).unsafeGet();

      expect(result.data).toHaveProperty('firstPrice', pair.first_price);
      expect(result.data).toHaveProperty('lastPrice', pair.last_price);
      expect(result.data).toHaveProperty('low', pair.low);
      expect(result.data).toHaveProperty('high', pair.high);
      expect(result.data).toHaveProperty('volume', pair.volume);
      expect(result.data).toHaveProperty('quoteVolume', pair.quote_volume);
      expect(result.data).toHaveProperty('volumeWaves', pair.volume_waves);
      expect(result.data).toHaveProperty('weightedAveragePrice', pair.weighted_average_price);
      expect(result.data).toHaveProperty('txsCount', pair.txs_count);
    });

    it('should return null for non existing pair', (done) => {
      service
        .get({
          matcher: options.matcher.defaultMatcherAddress,
          pair: {
            amountAsset: '111',
            priceAsset: '222',
          },
        })
        .run()
        .listen({
          onRejected: done.fail,
          onResolved: (pair) => {
            expect(pair).toBeNothing();
            done();
          },
        });
    });
  });

  describe('get many pairs', () => {
    it('should return Pairs for one correctly', async () => {
      const result = await service
        .mget({
          matcher: options.matcher.defaultMatcherAddress,
          pairs: [
            {
              amountAsset: pair.amount_asset_id,
              priceAsset: pair.price_asset_id,
            },
          ],
        })
        .run()
        .promise();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].data).toHaveProperty('firstPrice', pair.first_price);
      expect(result.data[0].data).toHaveProperty('lastPrice', pair.last_price);
      expect(result.data[0].data).toHaveProperty('volume', pair.volume);
      expect(result.data[0].data).toHaveProperty('volumeWaves', pair.volume_waves);
    });

    it('should return null for non existing pairs', (done) => {
      service
        .mget({
          matcher: options.matcher.defaultMatcherAddress,
          pairs: [
            {
              amountAsset: '111',
              priceAsset: '222',
            },
          ],
        })
        .run()
        .listen({
          onResolved: (pairs) => {
            expect(pairs.__type).toEqual('list');
            expect(pairs.data).toEqual([{ __type: 'pair', data: null }]);
            done();
          },
        });
    });
  });

  describe('search pairs', () => {
    it('should return Pairs correctly', async () => {
      const result = await service
        .search({
          limit: 2,
          matcher: options.matcher.defaultMatcherAddress,
          search_by_assets: ['WAVES', 'BTC'],
        })
        .run()
        .promise();

      result.data.forEach((pair) => {
        expect(typeof pair.amountAsset).toBe('string');
        expect(typeof pair.priceAsset).toBe('string');
        expect(pair.data.firstPrice).toBeInstanceOf(BigNumber);
        expect(pair.data.lastPrice).toBeInstanceOf(BigNumber);
        expect(pair.data.volume).toBeInstanceOf(BigNumber);
        expect(pair.data.volumeWaves).toBeInstanceOf(BigNumber);
      });
    });
  });
});
