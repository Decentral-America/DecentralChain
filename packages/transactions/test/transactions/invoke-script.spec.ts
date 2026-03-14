import { publicKey } from '@decentralchain/ts-lib-crypto';
import { type IInvokeScriptParams, invokeScript } from '../../src';
import { invokeScriptMinimalParams } from '../minimalParams';
import {
  checkBinarySerializeDeserialize,
  checkProtoSerializeDeserialize,
  errorMessageByTemplate,
  validateTxSignature,
} from '../utils';
import { invokeScriptBinaryTx } from './expected/binary/invoke-script.tx';
import { invokeScriptTx } from './expected/proto/invoke-script.tx';

describe('invokeScript', () => {
  const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8';

  it('should build from minimal set of params', () => {
    const tx = invokeScript({ ...invokeScriptMinimalParams }, stringSeed);
    expect(tx).toMatchObject({
      ...invokeScriptMinimalParams,
      chainId: 76,
      fee: 500000,
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
    const _tx = invokeScript(
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

  it('should build without args', () => {
    const params: IInvokeScriptParams = {
      call: {
        function: 'foo',
      },
      dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
    };
    const tx = invokeScript(params, stringSeed);
    expect(tx).toMatchObject({
      call: {
        args: [],
        function: 'foo',
      },
      dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
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
    call: {
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
      function: 'foo',
    },
    dApp: '3N3Cn2pYtqzj7N9pviSesNe8KG9Cmb718Y1',
  };

  it('Should build with test set params', () => {
    const tx = invokeScript({ ...testInvokeScriptParams }, stringSeed);
    expect(tx).toMatchObject({ ...testInvokeScriptParams });
  });

  it.todo('Should create invoke tx for default function — needs fixture update');
});

describe('serialize/deserialize invoke tx', () => {
  Object.entries(invokeScriptTx).forEach(([name, { Bytes, Json }]) => {
    it(name, () => {
      checkProtoSerializeDeserialize({ Bytes: Bytes, Json: Json });
    });
  });
});

describe('serialize/deserialize invoke binary tx', () => {
  Object.entries(invokeScriptBinaryTx).forEach(([name, { Bytes, Json }]) => {
    it(name, () => {
      checkBinarySerializeDeserialize({ Bytes: Bytes, Json: Json });
    });
  });
});
