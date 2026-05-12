import { Option } from 'effect';
import { PairOrderingServiceImpl } from '..';

describe('PairOrderingService', () => {
  const matcherAddress = 'matcher-address';
  const priceAssets = ['DCC', 'USD'];
  const service = new PairOrderingServiceImpl({ [matcherAddress]: priceAssets });

  describe('isCorrectOrder', () => {
    it('should return Some(true) for correct order', () => {
      const result = service.isCorrectOrder(matcherAddress, {
        amountAsset: 'ASSET',
        priceAsset: 'DCC',
      });
      expect(Option.isSome(result)).toBe(true);
    });

    it('should return None for unknown matcher', () => {
      const result = service.isCorrectOrder('unknown-matcher', {
        amountAsset: 'ASSET',
        priceAsset: 'DCC',
      });
      expect(Option.isNone(result)).toBe(true);
    });
  });

  describe('getCorrectOrder', () => {
    it('should return Some with correctly ordered pair', () => {
      const result = service.getCorrectOrder(matcherAddress, ['DCC', 'ASSET']);
      expect(Option.isSome(result)).toBe(true);
    });

    it('should return None for unknown matcher', () => {
      const result = service.getCorrectOrder('unknown-matcher', ['DCC', 'ASSET']);
      expect(Option.isNone(result)).toBe(true);
    });
  });
});
