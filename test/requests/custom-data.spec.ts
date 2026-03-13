import { base58Encode, blake2b } from '@decentralchain/ts-lib-crypto';
import { DATA_FIELD_TYPE } from '@decentralchain/ts-types';
import { verifyCustomData } from '../../src/general';
import { customData, serializeCustomData } from '../../src/requests/custom-data';

describe('custom-data', () => {
  const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8';

  it('sign v1', () => {
    const p = { binary: '0J/RgNC40LLQtdGCINC80LjRgAo=', version: 1 as const };
    const d = customData(p, stringSeed);
    expect(d).toMatchObject(p);
    expect(d.hash).toEqual(base58Encode(blake2b(serializeCustomData(d))));
    expect(verifyCustomData(d)).toBe(true);
  });

  it('get v1 data', () => {
    const p = { binary: '0J/RgNC40LLQtdGCINC80LjRgAo=', version: 1 as const };
    const d = customData(p);
    expect(d).toMatchObject(p);
    expect(d.hash).toEqual(base58Encode(blake2b(serializeCustomData(d))));
  });

  it('sign v2', () => {
    const d = customData(
      {
        data: [
          {
            key: 'foo',
            type: DATA_FIELD_TYPE.INTEGER,
            value: 1,
          },
        ],
        version: 2,
      },
      stringSeed,
    );
    expect(verifyCustomData(d)).toBe(true);
  });
});
