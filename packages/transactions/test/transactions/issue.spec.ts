import { publicKey } from '@decentralchain/ts-lib-crypto';
import { issue } from '../../src';
import {
  checkBinarySerializeDeserialize,
  checkProtoSerializeDeserialize,
  errorMessageByTemplate,
  longMax,
  rndString,
  validateTxSignature,
} from '../utils';
import { issueMinimalParams } from '../minimalParams';
import { issueTx } from './expected/proto/issue.tx';
import { issueBinaryTx } from './expected/binary/issue.tx';

describe('issue', () => {
  const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8';
  const protoBytesMinVersion = 2;

<<<<<<< HEAD
    const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8';
    const protoBytesMinVersion = 2;

    it('should build from minimal set of params', () => {
        const tx = issue({...issueMinimalParams}, stringSeed);
        expect(tx).toMatchObject({...issueMinimalParams, decimals: 8, fee: 100000000, chainId:76, reissuable: false})
    });

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f33083a0 (updated dependencies)
    it('should create issue tx with max name length = 16 and max description length = 1000', () => {
        const descr = rndString(1000);
        const tx = issue({...issueMinimalParams, name: 'this_is_16_bytes', description: descr}, stringSeed);
        expect(tx.name).toEqual('this_is_16_bytes');
        expect(tx.description).toEqual(descr);
    });
<<<<<<< HEAD
=======
  it('should build from minimal set of params with quantity 1', () => {
    const tx = issue({ ...issueMinimalParams, quantity: 1 }, stringSeed)
    expect(tx.fee).toEqual(100000000000)
  })
>>>>>>> 697d643a (minor fixes)
=======
>>>>>>> f33083a0 (updated dependencies)

    it('should not create from minimal set of params with zero quantity', () => {
        expect(() => issue({...issueMinimalParams, quantity: 0}, stringSeed))
            .toThrowError(errorMessageByTemplate('quantity', 0))
    });

    it('should not create from minimal set of params with negative quantity', () => {
        expect(() => issue({...issueMinimalParams, quantity: -1}, stringSeed))
            .toThrowError(errorMessageByTemplate('quantity', -1))
    });

    it('should not create with name length < 4', () => {
        expect(() => issue({...issueMinimalParams, name: 'xxx'}, stringSeed))
            .toThrowError(errorMessageByTemplate('name', 'xxx'))
    });

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f33083a0 (updated dependencies)
    it('should not create with max name length > 16', () => {
        expect(() => issue({...issueMinimalParams, name: 'this_is_17_bytes_'}, stringSeed))
            .toThrowError(errorMessageByTemplate('name', 'this_is_17_bytes_'))
    });
<<<<<<< HEAD

    it('should not create with description length > 1000', () => {
        const descr = rndString(1001);
        expect(() => issue({...issueMinimalParams, description: descr}, stringSeed))
            .toThrowError(errorMessageByTemplate('description', descr))
    });

    it('should create from minimal set of params with maximal quantity', () => {
        const tx = issue({...issueMinimalParams, quantity: longMax}, stringSeed);
        expect(tx.quantity).toEqual(longMax)
    });
=======
    expect(validateTxSignature(tx, protoBytesMinVersion)).toBeTruthy()
  })
=======
>>>>>>> f33083a0 (updated dependencies)

    it('should not create with description length > 1000', () => {
        const descr = rndString(1001);
        expect(() => issue({...issueMinimalParams, description: descr}, stringSeed))
            .toThrowError(errorMessageByTemplate('description', descr))
    });

<<<<<<< HEAD
    expect(validateTxSignature(tx, protoBytesMinVersion)).toBeTruthy()
  })
>>>>>>> 697d643a (minor fixes)
=======
    it('should create from minimal set of params with maximal quantity', () => {
        const tx = issue({...issueMinimalParams, quantity: longMax}, stringSeed);
        expect(tx.quantity).toEqual(longMax)
    });
>>>>>>> f33083a0 (updated dependencies)

    it('should build with asset script', () => {
        const script = 'AQQAAAAHJG1hdGNoMAUAAAACdHgDCQAAAQAAAAIFAAAAByRtYXRjaDACAAAAD0J1cm5UcmFuc2FjdGlvbgQAAAABdAUAAAAHJG1hdGNoMAcGPmRSDA==';
        const tx = issue({...issueMinimalParams, script: script}, stringSeed);
        expect(tx).toMatchObject({...issueMinimalParams, script: 'base64:' + script})
    });

    it('should build with asset script, with prefix base64', () => {
        const script = 'base64:AQQAAAAHJG1hdGNoMAUAAAACdHgDCQAAAQAAAAIFAAAAByRtYXRjaDACAAAAD0J1cm5UcmFuc2FjdGlvbgQAAAABdAUAAAAHJG1hdGNoMAcGPmRSDA==';
        const tx = issue({...issueMinimalParams, script: script}, stringSeed);
        expect(tx).toMatchObject({...issueMinimalParams, script: script})
    });

    it('should correctly set reissuable and decimals', () => {
        const tx = issue({...issueMinimalParams, decimals: 0, reissuable: true}, stringSeed);
        expect(tx).toMatchObject({decimals: 0, reissuable: true, fee: 100000000})
    });

    it('should set correct minimal fee for NFT token', () =>{
      const tx = issue({...issueMinimalParams, quantity: 1, decimals: 0, reissuable: false}, stringSeed);
      expect(tx).toMatchObject({quantity: 1, decimals: 0, reissuable: false, fee: 100000})
    });

    it('Should get correct signature of NFT token', () => {
        const tx = issue({
            ...issueMinimalParams,
            quantity: 1,
            decimals: 0,
        }, stringSeed);

        expect(validateTxSignature(tx, protoBytesMinVersion)).toBeTruthy()
    });

    it('Should sign already signed', () => {
        let tx = issue({...issueMinimalParams}, stringSeed);
        tx = issue(tx, stringSeed);
        expect(validateTxSignature(tx, protoBytesMinVersion, 1)).toBeTruthy()
    });

    it('Should get correct multiSignature', () => {
        const stringSeed2 = 'example seed 2';
        const tx = issue({...issueMinimalParams}, [null, stringSeed, null, stringSeed2]);
        expect(validateTxSignature(tx, protoBytesMinVersion, 1, publicKey(stringSeed))).toBeTruthy();
        expect(validateTxSignature(tx, protoBytesMinVersion, 3, publicKey(stringSeed2))).toBeTruthy()
    });

    it('should create correctly with custom fee', () => {
        const tx = issue({...issueMinimalParams, fee: 500000}, stringSeed);
        expect(tx.fee).toEqual(500000)
    });

    it('should create correctly with zero fee', () => {
        const tx = issue({...issueMinimalParams, fee: 0}, stringSeed);
        expect(tx.fee).toEqual(0)
    });

    it('should not create correctly with negative fee', () => {
        expect(() => issue({...issueMinimalParams, fee: -1}, stringSeed))
            .toThrowError(errorMessageByTemplate('fee', -1))
=======
  it('should build from minimal set of params', () => {
    const tx = issue({ ...issueMinimalParams }, stringSeed);
    expect(tx).toMatchObject({
      ...issueMinimalParams,
      decimals: 8,
      fee: 100000000,
      chainId: 76,
      reissuable: false,
<<<<<<< HEAD:test/transactions/issue.test.ts
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
    })
  })
=======
    });
  });
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/issue.spec.ts

  it('should create issue tx with max name length = 16 and max description length = 1000', () => {
    const descr = rndString(1000);
    const tx = issue(
      { ...issueMinimalParams, name: 'this_is_16_bytes', description: descr },
      stringSeed,
    );
    expect(tx.name).toEqual('this_is_16_bytes');
    expect(tx.description).toEqual(descr);
  });

  it('should not create from minimal set of params with zero quantity', () => {
    expect(() => issue({ ...issueMinimalParams, quantity: 0 }, stringSeed)).toThrowError(
      errorMessageByTemplate('quantity', 0),
    );
  });

  it('should not create from minimal set of params with negative quantity', () => {
    expect(() => issue({ ...issueMinimalParams, quantity: -1 }, stringSeed)).toThrowError(
      errorMessageByTemplate('quantity', -1),
    );
  });

  it('should not create with name length < 4', () => {
    expect(() => issue({ ...issueMinimalParams, name: 'xxx' }, stringSeed)).toThrowError(
      errorMessageByTemplate('name', 'xxx'),
    );
  });

  it('should not create with max name length > 16', () => {
    expect(() =>
      issue({ ...issueMinimalParams, name: 'this_is_17_bytes_' }, stringSeed),
    ).toThrowError(errorMessageByTemplate('name', 'this_is_17_bytes_'));
  });

  it('should not create with description length > 1000', () => {
    const descr = rndString(1001);
    expect(() => issue({ ...issueMinimalParams, description: descr }, stringSeed)).toThrowError(
      errorMessageByTemplate('description', descr),
    );
  });

  it('should create from minimal set of params with maximal quantity', () => {
    const tx = issue({ ...issueMinimalParams, quantity: longMax }, stringSeed);
    expect(tx.quantity).toEqual(longMax);
  });

  it('should build with asset script', () => {
    const script =
      'AQQAAAAHJG1hdGNoMAUAAAACdHgDCQAAAQAAAAIFAAAAByRtYXRjaDACAAAAD0J1cm5UcmFuc2FjdGlvbgQAAAABdAUAAAAHJG1hdGNoMAcGPmRSDA==';
    const tx = issue({ ...issueMinimalParams, script: script }, stringSeed);
    expect(tx).toMatchObject({ ...issueMinimalParams, script: 'base64:' + script });
  });

  it('should build with asset script, with prefix base64', () => {
    const script =
      'base64:AQQAAAAHJG1hdGNoMAUAAAACdHgDCQAAAQAAAAIFAAAAByRtYXRjaDACAAAAD0J1cm5UcmFuc2FjdGlvbgQAAAABdAUAAAAHJG1hdGNoMAcGPmRSDA==';
    const tx = issue({ ...issueMinimalParams, script: script }, stringSeed);
    expect(tx).toMatchObject({ ...issueMinimalParams, script: script });
  });

  it('should correctly set reissuable and decimals', () => {
    const tx = issue({ ...issueMinimalParams, decimals: 0, reissuable: true }, stringSeed);
    expect(tx).toMatchObject({ decimals: 0, reissuable: true, fee: 100000000 });
  });

  it('should set correct minimal fee for NFT token', () => {
    const tx = issue(
      { ...issueMinimalParams, quantity: 1, decimals: 0, reissuable: false },
      stringSeed,
    );
    expect(tx).toMatchObject({ quantity: 1, decimals: 0, reissuable: false, fee: 100000 });
  });

  it('Should get correct signature of NFT token', () => {
    const tx = issue(
      {
        ...issueMinimalParams,
        quantity: 1,
        decimals: 0,
      },
      stringSeed,
    );

    expect(validateTxSignature(tx, protoBytesMinVersion)).toBeTruthy();
  });

  it('Should sign already signed', () => {
    let tx = issue({ ...issueMinimalParams }, stringSeed);
    tx = issue(tx, stringSeed);
    expect(validateTxSignature(tx, protoBytesMinVersion, 1)).toBeTruthy();
  });

  it('Should get correct multiSignature', () => {
    const stringSeed2 = 'example seed 2';
    const tx = issue({ ...issueMinimalParams }, [null, stringSeed, null, stringSeed2]);
    expect(validateTxSignature(tx, protoBytesMinVersion, 1, publicKey(stringSeed))).toBeTruthy();
    expect(validateTxSignature(tx, protoBytesMinVersion, 3, publicKey(stringSeed2))).toBeTruthy();
  });

  it('should create correctly with custom fee', () => {
    const tx = issue({ ...issueMinimalParams, fee: 500000 }, stringSeed);
    expect(tx.fee).toEqual(500000);
  });

  it('should create correctly with zero fee', () => {
    const tx = issue({ ...issueMinimalParams, fee: 0 }, stringSeed);
    expect(tx.fee).toEqual(0);
  });

  it('should not create correctly with negative fee', () => {
    expect(() => issue({ ...issueMinimalParams, fee: -1 }, stringSeed)).toThrowError(
      errorMessageByTemplate('fee', -1),
    );
  });
});

describe('serialize/deserialize issue tx', () => {
  Object.entries(issueTx).forEach(([name, { Bytes, Json }]) =>
    it(name, () => {
      checkProtoSerializeDeserialize({ Json: Json, Bytes: Bytes });
    }),
  );
});

describe('serialize/deserialize binary issue tx', () => {
  Object.entries(issueBinaryTx).forEach(([name, { Bytes, Json }]) =>
    it(name, () => {
      checkBinarySerializeDeserialize({ Json: Json, Bytes: Bytes });
    }),
  );
});
