<<<<<<< HEAD:test/transactions/invoke-script.test.ts
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f33083a0 (updated dependencies)
import {protoBytesToTx, txToProtoBytes} from '../../src/proto-serialize'
import {publicKey} from '@decentralchain/ts-lib-crypto'
import {invokeScriptMinimalParams} from '../minimalParams'
import {invokeScript, setScript, waitForTx} from '../../src'
import {IInvokeScriptParams} from '../../src'
=======
import { protoBytesToTx, txToProtoBytes } from '../../src/proto-serialize'
import { publicKey } from '@decentralchain/ts-lib-crypto'
import { invokeScriptMinimalParams } from '../minimalParams'
import { invokeScript, setScript, waitForTx } from '../../src'
import { IInvokeScriptParams } from '../../src'
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
import { protoBytesToTx, txToProtoBytes } from '../../src/proto-serialize';
import { publicKey } from '@decentralchain/ts-lib-crypto';
import { invokeScriptMinimalParams } from '../minimalParams';
import { invokeScript, setScript, waitForTx } from '../../src';
import { IInvokeScriptParams } from '../../src';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/invoke-script.spec.ts
import {
  checkBinarySerializeDeserialize,
  checkProtoSerializeDeserialize,
  errorMessageByTemplate,
  validateTxSignature,
<<<<<<< HEAD:test/transactions/invoke-script.test.ts
} from '../utils'
<<<<<<< HEAD
import {invokeScriptTx} from './expected/proto/invoke-script.tx'
import {invokeScriptBinaryTx} from './expected/binary/invoke-script.tx'
import {API_BASE, TIMEOUT} from '../integration/config'
import {broadcast} from '../../src'
<<<<<<< HEAD
=======
import { publicKey } from '@waves/ts-lib-crypto'
import { invokeScriptMinimalParams } from '../minimalParams'
import { invokeScript } from '../../src/transactions/invoke-script'
import { binary } from '@decentralchain/marshall'
import { IInvokeScriptParams } from '../../src'
import { validateTxSignature } from '../../test/utils'
>>>>>>> 697d643a (minor fixes)
=======
>>>>>>> f33083a0 (updated dependencies)
=======
import { invokeScriptTx } from './expected/proto/invoke-script.tx'
import { invokeScriptBinaryTx } from './expected/binary/invoke-script.tx'
import { API_BASE, TIMEOUT } from '../integration/config'
import { broadcast } from '../../src'
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
=======
} from '../utils';
import { invokeScriptTx } from './expected/proto/invoke-script.tx';
import { invokeScriptBinaryTx } from './expected/binary/invoke-script.tx';
import { API_BASE, TIMEOUT } from '../integration/config';
import { broadcast } from '../../src';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/invoke-script.spec.ts

describe('invokeScript', () => {
  const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8';

  it('should build from minimal set of params', () => {
    const tx = invokeScript({ ...invokeScriptMinimalParams }, stringSeed);
    expect(tx).toMatchObject({
      ...invokeScriptMinimalParams,
      fee: 500000,
      chainId: 76,
      version: 2,
    });
  });

  it('should build from minimal set of params for tx version 1', () => {
    const tx = invokeScript({ ...invokeScriptMinimalParams, version: 1 } as any, stringSeed);
    expect(tx).toMatchObject({ ...invokeScriptMinimalParams, version: 1 });
  });

  it('Should build with nullable call field', () => {
    const stringSeed2 =
      'shiver excess resource rather roast nation rib clump nerve reject skirt soccer congress pelican involve';
    const tx = invokeScript(
      {
        ...invokeScriptMinimalParams,
        payment: [{ amount: 100, assetId: null }],
      },
      [stringSeed2],
    );
  });

  it('should build from minimal set of params with payment', () => {
    const tx = invokeScript(
      { ...invokeScriptMinimalParams, payment: [{ amount: 100, assetId: null }] },
      stringSeed,
    );
    expect(tx).toMatchObject({
      ...invokeScriptMinimalParams,
      payment: [{ amount: 100, assetId: null }],
    });
  });

<<<<<<< HEAD
    it('should build from minimal set of params for tx version 1', () => {
        const tx = invokeScript({...invokeScriptMinimalParams, version: 1} as any, stringSeed)
        expect(tx).toMatchObject({...invokeScriptMinimalParams, version: 1})
    })


    it('Should build with nullable call field', () => {
        const stringSeed2 = 'shiver excess resource rather roast nation rib clump nerve reject skirt soccer congress pelican involve'
        const tx = invokeScript({
            ...invokeScriptMinimalParams,
            payment: [{amount: 100, assetId: null}],
        }, [stringSeed2])

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> f33083a0 (updated dependencies)
        console.log(protoBytesToTx(txToProtoBytes(tx)))
    })

    it('should build from minimal set of params with payment', () => {
        const tx = invokeScript({...invokeScriptMinimalParams, payment: [{amount: 100, assetId: null}]}, stringSeed)
        expect(tx).toMatchObject({...invokeScriptMinimalParams, payment: [{amount: 100, assetId: null}]})
    })

    it('should build without args', () => {
        const params: IInvokeScriptParams = {
            dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
            call: {
                function: 'foo',
            },
        }
        const tx = invokeScript(params, stringSeed)
        expect(tx).toMatchObject({
            dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
            call: {
                function: 'foo',
                args: [],
            },
        })
    })

    it('Should get correct signature', () => {
        const tx = invokeScript({...invokeScriptMinimalParams}, stringSeed)
        expect(validateTxSignature(tx, 1)).toBeTruthy()
    })

    it('Should sign already signed', () => {
        let tx = invokeScript({...invokeScriptMinimalParams}, stringSeed)
        tx = invokeScript(tx, stringSeed)
        expect(validateTxSignature(tx, 1, 1)).toBeTruthy()
    })

    it('Should get correct multiSignature', () => {
        const stringSeed2 = 'example seed 2'
        const tx = invokeScript({
            ...invokeScriptMinimalParams,
            payment: [{amount: 100, assetId: null}],
        }, [null, stringSeed, null, stringSeed2])

        expect(validateTxSignature(tx, 1, 1, publicKey(stringSeed))).toBeTruthy()
        expect(validateTxSignature(tx, 1, 3, publicKey(stringSeed2))).toBeTruthy()
    })

    it('Should create with custom fee', () => {
        const tx = invokeScript({...invokeScriptMinimalParams, fee: 100000}, stringSeed)
        expect(tx.fee).toEqual(100000)
    })

    it('Should create invoke tx with zero fee', () => {
        const tx = invokeScript({...invokeScriptMinimalParams, fee: 0}, stringSeed)
        expect(tx.fee).toEqual(0)
    })

    it('Should not create with negative fee', () => {
        expect(() => invokeScript({...invokeScriptMinimalParams, fee: -1}, stringSeed))
            .toThrowError(errorMessageByTemplate('fee', -1))

    })

    const testInvokeScriptParams: IInvokeScriptParams = {
        dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
        call: {
            function: 'foo',
            args: [
                {
                    type: 'binary',
                    value: 'base64:AQa3b8tH',
                },
                {
                    type: 'boolean',
                    value: true,
                },
                {
                    type: 'integer',
                    value: 1234567890,
                },
                {
                    type: 'string',
                    value: 'Test Test123 test321',
                },
                {
                    type: 'list',
                    value: [
                        {
                            type: 'binary',
                            value: 'base64:UmlkZQ==',
                        },
                        {
                            type: 'boolean',
                            value: false,
                        },
                        {
                            type: 'integer',
                            value: 223322,
                        },
                        {
                            type: 'string',
                            value: 'Porto Franko',
                        },
                    ],
                },
            ],
        },
=======
  it('should build without args', () => {
    const params: IInvokeScriptParams = {
      dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
      call: {
        function: 'foo',
      },
<<<<<<< HEAD:test/transactions/invoke-script.test.ts
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
    }
    const tx = invokeScript(params, stringSeed)
=======
    };
    const tx = invokeScript(params, stringSeed);
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/invoke-script.spec.ts
    expect(tx).toMatchObject({
      dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
      call: {
        function: 'foo',
        args: [],
      },
    });
  });

  it('Should get correct signature', () => {
    const tx = invokeScript({ ...invokeScriptMinimalParams }, stringSeed);
    expect(validateTxSignature(tx, 1)).toBe(true);
  });

  it('Should sign already signed', () => {
    let tx = invokeScript({ ...invokeScriptMinimalParams }, stringSeed);
    tx = invokeScript(tx, stringSeed);
    expect(validateTxSignature(tx, 1, 1)).toBe(true);
  });

  it('Should get correct multiSignature', () => {
    const stringSeed2 = 'example seed 2';
    const tx = invokeScript(
      {
        ...invokeScriptMinimalParams,
        payment: [{ amount: 100, assetId: null }],
      },
      [null, stringSeed, null, stringSeed2],
    );

    expect(validateTxSignature(tx, 1, 1, publicKey(stringSeed))).toBe(true);
    expect(validateTxSignature(tx, 1, 3, publicKey(stringSeed2))).toBe(true);
  });

  it('Should create with custom fee', () => {
    const tx = invokeScript({ ...invokeScriptMinimalParams, fee: 100000 }, stringSeed);
    expect(tx.fee).toEqual(100000);
  });

  it('Should not create invoke tx with zero fee', () => {
    expect(() => invokeScript({ ...invokeScriptMinimalParams, fee: 0 }, stringSeed)).toThrowError(
      errorMessageByTemplate('fee', 0),
    );
  });

  it('Should not create with negative fee', () => {
    expect(() => invokeScript({ ...invokeScriptMinimalParams, fee: -1 }, stringSeed)).toThrowError(
      errorMessageByTemplate('fee', -1),
    );
  });

  const testInvokeScriptParams: IInvokeScriptParams = {
    dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
    call: {
      function: 'foo',
      args: [
        {
          type: 'binary',
          value: 'base64:AQa3b8tH',
        },
        {
          type: 'boolean',
          value: true,
        },
        {
          type: 'integer',
          value: 1234567890,
        },
        {
          type: 'string',
          value: 'Test Test123 test321',
        },
        {
          type: 'list',
          value: [
            {
              type: 'binary',
              value: 'base64:UmlkZQ==',
            },
            {
              type: 'boolean',
              value: false,
            },
            {
              type: 'integer',
              value: 223322,
            },
            {
              type: 'string',
              value: 'Porto Franko',
            },
          ],
        },
      ],
    },
  };

  it('Should build with test set params', () => {
    const tx = invokeScript({ ...testInvokeScriptParams }, stringSeed);
    expect(tx).toMatchObject({ ...testInvokeScriptParams });
  });

  it.todo('Should create invoke tx for default function — needs fixture update');
});

describe('serialize/deserialize invoke tx', () => {
  Object.entries(invokeScriptTx).forEach(([name, { Bytes, Json }]) =>
    it(name, () => {
      checkProtoSerializeDeserialize({ Json: Json, Bytes: Bytes });
    }),
  );
});

describe('serialize/deserialize invoke binary tx', () => {
<<<<<<< HEAD

    Object.entries(invokeScriptBinaryTx).forEach(([name, {Bytes, Json}]) =>
        it(name, () => {
            checkBinarySerializeDeserialize({Json: Json, Bytes: Bytes})
        }))
<<<<<<< HEAD
=======
  it('Should get correct multiSignature', () => {
    const stringSeed2 = 'example seed 2'
    const tx = invokeScript({
      ...invokeScriptMinimalParams,
      payment: [{ amount: 100, assetId: null }]
    }, [null, stringSeed, null, stringSeed2])
>>>>>>> 697d643a (minor fixes)
=======
>>>>>>> f33083a0 (updated dependencies)

=======
  Object.entries(invokeScriptBinaryTx).forEach(([name, { Bytes, Json }]) =>
    it(name, () => {
      checkBinarySerializeDeserialize({ Json: Json, Bytes: Bytes });
    }),
<<<<<<< HEAD:test/transactions/invoke-script.test.ts
  )
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
})
=======
  );
});
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup):test/transactions/invoke-script.spec.ts
