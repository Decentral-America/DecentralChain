import { Asset, BigNumber } from '@decentralchain/data-entities';
import { Option } from 'effect';
import { MoneyFormat } from '../../../../types';
import RateInfoLookup from '../RateInfoLookup';

describe('RateInfoLookup', () => {
  describe('get', () => {
    it('should get rate exactly for requested pair', () => {
      const amountAsset = new Asset({
        description: '',
        hasScript: false,
        height: 0,
        id: 'WAVES',
        minSponsoredFee: 0,
        name: 'Waves',
        precision: 8,
        quantity: 100,
        reissuable: false,
        sender: '',
        timestamp: new Date(),
      });
      const baseAsset = new Asset({
        description: '',
        hasScript: false,
        height: 1,
        id: 'USDN',
        minSponsoredFee: 0,
        name: 'USDN',
        precision: 6,
        quantity: 100,
        reissuable: false,
        sender: '',
        timestamp: new Date(),
      });

      const data = [
        {
          amountAsset,
          priceAsset: baseAsset,
          rate: new BigNumber(10),
          volumeWaves: new BigNumber(100),
        },
      ];

      const lookup = new RateInfoLookup(data, Option.none(), baseAsset);

      const request = {
        amountAsset: baseAsset,
        moneyFormat: MoneyFormat.Long,
        priceAsset: amountAsset,
      };
      const result = lookup.get(request);
      const rate = Option.isSome(result) ? result.value : undefined;

      expect(rate).toBeDefined();
      expect(rate?.amountAsset.id).toEqual(request.amountAsset.id);
      expect(rate?.priceAsset.id).toEqual(request.priceAsset.id);
    });
  });
});
