<<<<<<< HEAD
<<<<<<< HEAD:test/transactions/burn.test.ts
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
import {publicKey} from '@waves/ts-lib-crypto'
=======
import {base64Decode, base64Encode, publicKey} from '@waves/ts-lib-crypto'
>>>>>>> f33083a0 (updated dependencies)
=======
import {base64Decode, base64Encode, publicKey} from '@decentralchain/ts-lib-crypto'
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)
import {burn} from '../../src'
import {burnMinimalParams} from '../minimalParams'
import {
    checkBinarySerializeDeserialize,
    checkProtoSerializeDeserialize,
    errorMessageByTemplate,
    validateTxSignature
<<<<<<< HEAD
} from '../utils'
import {burnTx} from './expected/proto/burn.tx'
import {burnBinaryTx} from './expected/binary/burn.tx'
=======
} from '../../test/utils'
import {burnTx} from "./expected/proto/burn.tx"
import {burnBinaryTx} from "./expected/binary/burn.tx"
<<<<<<< HEAD
import {binary} from '@waves/marshall'
>>>>>>> f33083a0 (updated dependencies)
=======
import {binary} from '@decentralchain/marshall'
>>>>>>> 71f18869 (feat(DCC-18): migrate from Waves to DecentralChain branding)

=======
import { base64Decode, base64Encode, publicKey } from '@decentralchain/ts-lib-crypto'
import { burn } from '../../src'
import { burnMinimalParams } from '../minimalParams'
=======
import { base64Decode, base64Encode, publicKey } from '@decentralchain/ts-lib-crypto';
=======
import { publicKey } from '@decentralchain/ts-lib-crypto';
>>>>>>> 1825a504 (refactor(DCC-18): harden error handling, add security warnings, and remove dead imports)
import { burn } from '../../src';
import { burnMinimalParams } from '../minimalParams';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/burn.spec.ts
import {
  checkBinarySerializeDeserialize,
  checkProtoSerializeDeserialize,
  errorMessageByTemplate,
  validateTxSignature,
<<<<<<< HEAD:test/transactions/burn.test.ts
} from '../../test/utils'
import { burnTx } from './expected/proto/burn.tx'
import { burnBinaryTx } from './expected/binary/burn.tx'
import { binary } from '@decentralchain/marshall'
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
} from '../../test/utils';
import { burnTx } from './expected/proto/burn.tx';
import { burnBinaryTx } from './expected/binary/burn.tx';
<<<<<<< HEAD
import { binary } from '@decentralchain/marshall';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/burn.spec.ts
=======
>>>>>>> 1825a504 (refactor(DCC-18): harden error handling, add security warnings, and remove dead imports)

describe('burn', () => {
  const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8';

  it('should build from minimal set of params', () => {
    const tx = burn({ ...burnMinimalParams } as any, stringSeed);
    expect(tx).toMatchObject({ ...burnMinimalParams, fee: 100000, chainId: 76, version: 3 });
  });

  it('Should get correct signature', () => {
    const tx = burn({ ...burnMinimalParams }, stringSeed);
    expect(validateTxSignature(tx, 2)).toBe(true);
  });

  it('Should sign already signed', () => {
    let tx = burn({ ...burnMinimalParams }, stringSeed);
    tx = burn(tx, stringSeed);
    expect(validateTxSignature(tx, 2, 1)).toBe(true);
  });

  it('Should get correct multiSignature', () => {
    const stringSeed2 = 'example seed 2';
    const tx = burn({ ...burnMinimalParams }, [null, stringSeed, null, stringSeed2]);
    expect(validateTxSignature(tx, 2, 1, publicKey(stringSeed))).toBe(true);
    expect(validateTxSignature(tx, 2, 3, publicKey(stringSeed2))).toBe(true);
  });

  it('Should not create with zero amount', () => {
    expect(() =>
      burn(
        {
          ...burnMinimalParams,
          amount: 0,
        },
        stringSeed,
      ),
    ).toThrowError('tx "amount" has invalid data. Check tx data.');
  });

<<<<<<< HEAD
    it('Should not create with zero amount', () => {
        expect(() => burn({
            ...burnMinimalParams,
<<<<<<< HEAD
            amount: 0,
=======
            amount: 0
>>>>>>> f33083a0 (updated dependencies)
        }, stringSeed)).toThrowError('tx "amount", has wrong data: 0. Check tx data.')
    })
=======
  it('Should create with custom amount', () => {
<<<<<<< HEAD:test/transactions/burn.test.ts
    const tx = burn({ ...burnMinimalParams, amount: 50000 }, stringSeed)
    expect(tx.amount).toEqual(50000)
  })
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
    const tx = burn({ ...burnMinimalParams, amount: 50000 }, stringSeed);
    expect(tx.amount).toEqual(50000);
  });
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/burn.spec.ts

  it('Should not create with negative amount', () => {
    expect(() => burn({ ...burnMinimalParams, amount: -1 }, stringSeed)).toThrowError(
      errorMessageByTemplate('amount', -1),
    );
  });

  it('Should create with custom fee', () => {
    const tx = burn({ ...burnMinimalParams, fee: 12345 }, stringSeed);
    expect(tx.fee).toEqual(12345);
  });

  it('Should not create with zero fee', () => {
    expect(() => burn({ ...burnMinimalParams, fee: 0 }, stringSeed)).toThrowError(
      errorMessageByTemplate('fee', 0),
    );
  });

<<<<<<< HEAD
    it('Should create with custom fee', () => {
        const tx = burn({...burnMinimalParams, fee: 12345}, stringSeed)
        expect(tx.fee).toEqual(12345)
    })
<<<<<<< HEAD

<<<<<<< HEAD
    it('Should create with zero fee', () => {
        const tx = burn({...burnMinimalParams, fee: 0}, stringSeed)
        expect(tx.fee).toEqual(0)
    })

    it('Should not create with negative fee', () => {
        expect(() => burn({...burnMinimalParams, fee: -1}, stringSeed))
            .toThrowError(errorMessageByTemplate('fee', -1))
    })

    it('Should not create with empty assetid', () => {
        expect(() => burn({...burnMinimalParams, assetId: ''}, stringSeed))
            .toThrowError(errorMessageByTemplate('assetId', ''))
    })

})

describe('serialize/deserialize burn tx', () => {

    Object.entries(burnTx).forEach(([name, {Bytes, Json}]) =>
        it(name, () => {
            checkProtoSerializeDeserialize({Json: Json, Bytes: Bytes})
        }))

})

describe('serialize/deserialize binary burn tx', () => {

    Object.entries(burnBinaryTx).forEach(([name, {Bytes, Json}]) =>
        it(name, () => {
            checkBinarySerializeDeserialize({Json: Json, Bytes: Bytes})
        }))

=======
  it('Should get correct multiSignature', () => {
    const stringSeed2 = 'example seed 2'
    const tx = burn({ ...burnMinimalParams }, [null, stringSeed, null, stringSeed2])
    expect(validateTxSignature(tx, 2, 1, publicKey(stringSeed))).toBeTruthy()
    expect(validateTxSignature(tx, 2, 3, publicKey(stringSeed2))).toBeTruthy()
  })
>>>>>>> 697d643a (minor fixes)
=======

    it('Should create with zero fee', () => {
        const tx = burn({...burnMinimalParams, fee: 0}, stringSeed)
        expect(tx.fee).toEqual(0)
    })

    it('Should not create with negative fee', () => {
        expect(() => burn({...burnMinimalParams, fee: -1}, stringSeed))
            .toThrowError(errorMessageByTemplate('fee', -1))
    })

    it('Should not create with empty assetid', () => {
        expect(() => burn({...burnMinimalParams, assetId: ''}, stringSeed))
            .toThrowError(errorMessageByTemplate('assetId', ''))
    })
=======
  it('Should not create with negative fee', () => {
    expect(() => burn({ ...burnMinimalParams, fee: -1 }, stringSeed)).toThrowError(
      errorMessageByTemplate('fee', -1),
<<<<<<< HEAD:test/transactions/burn.test.ts
    )
  })
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
    );
  });
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/burn.spec.ts

  it('Should not create with empty assetid', () => {
    expect(() => burn({ ...burnMinimalParams, assetId: '' }, stringSeed)).toThrowError(
      errorMessageByTemplate('assetId', ''),
    );
  });
});

describe('serialize/deserialize burn tx', () => {
  Object.entries(burnTx).forEach(([name, { Bytes, Json }]) =>
    it(name, () => {
      checkProtoSerializeDeserialize({ Json: Json, Bytes: Bytes });
    }),
  );
});

describe('serialize/deserialize binary burn tx', () => {
<<<<<<< HEAD

    Object.entries(burnBinaryTx).forEach(([name, {Bytes, Json}]) =>
        it(name, () => {
            checkBinarySerializeDeserialize({Json: Json, Bytes: Bytes})
        }))

>>>>>>> f33083a0 (updated dependencies)
=======
  Object.entries(burnBinaryTx).forEach(([name, { Bytes, Json }]) =>
    it(name, () => {
      checkBinarySerializeDeserialize({ Json: Json, Bytes: Bytes });
    }),
<<<<<<< HEAD:test/transactions/burn.test.ts
  )
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
})
=======
  );
});
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/burn.spec.ts
