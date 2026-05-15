import { binary } from '@decentralchain/marshall';
import { publicKey, verifySignature } from '@decentralchain/ts-lib-crypto';
import { order } from '../../src/index';
import { orderMinimalParams } from '../minimalParams';

describe('order', () => {
  const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8';

  it('should build from minimal set of params', () => {
    const params = { ...orderMinimalParams };
    const tx = order(params as any, stringSeed);
    const { amountAsset, priceAsset, ...rest } = params;
    expect(tx).toMatchObject(rest);
  });

  it('should get correct signature', () => {
    const tx = order({ ...orderMinimalParams }, stringSeed);
    expect(
      verifySignature(publicKey(stringSeed), binary.serializeOrder(tx), tx.proofs[0] as string),
    ).toBe(true);
  });

  it('should get correct multiSignature', () => {
    const stringSeed2 = 'example seed 2';
    const tx = order({ ...orderMinimalParams, orderType: 'sell' }, [
      null,
      stringSeed,
      null,
      stringSeed2,
    ]);
    expect(
      verifySignature(publicKey(stringSeed), binary.serializeOrder(tx), tx.proofs[1] as string),
    ).toBe(true);
    expect(
      verifySignature(publicKey(stringSeed2), binary.serializeOrder(tx), tx.proofs[3] as string),
    ).toBe(true);
  });
});
