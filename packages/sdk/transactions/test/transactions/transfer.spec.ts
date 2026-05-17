import { base58Encode, publicKey } from '@decentralchain/ts-lib-crypto';
import { transfer } from '../../src';
import { protoBytesToTx, txToProtoBytes } from '../../src/proto-serialize';
import {
  checkBinarySerializeDeserialize,
  checkProtoSerializeDeserialize,
  errorMessageByTemplate,
  validateTxSignature,
} from '../../test/utils';
import { transferMinimalParams } from '../minimalParams';
import { transferBinaryTx } from './expected/binary/transfer.tx';
import { transferTx } from './expected/proto/transfer.tx';

describe('transfer', () => {
  const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8';

  const privateKey = { privateKey: 'YkoCJDT4eLtCv5ynNAc4gmZo8ELM9bEbBXsEtGTWrCc' };

  it('should build from minimal set of params', () => {
    const tx = transfer({ ...transferMinimalParams }, stringSeed);
    expect(tx).toMatchObject({ ...transferMinimalParams, fee: 100000 });
  });

  it('Should get correct signature', () => {
    const tx = transfer({ ...transferMinimalParams }, stringSeed);
    expect(validateTxSignature(tx, 2)).toBe(true);
  });

  it('Should get correct signature via private key', () => {
    const tx = transfer({ ...transferMinimalParams }, privateKey);
    expect(validateTxSignature(tx, 2)).toBe(true);
  });

  it('Should get correct multiSignature', () => {
    const stringSeed2 = 'example seed 2';
    const tx = transfer({ ...transferMinimalParams }, [null, stringSeed, null, stringSeed2]);

    expect(validateTxSignature(tx, 2, 1, publicKey(stringSeed))).toBe(true);
    expect(validateTxSignature(tx, 2, 3, publicKey(stringSeed2))).toBe(true);
  });

  it('Should build with custom fee and amount', () => {
    const tx = transfer({ ...transferMinimalParams, amount: 666, fee: 12345 }, stringSeed);
    expect(tx).toMatchObject({ ...transferMinimalParams, amount: 666, fee: 12345 });
  });

  it('Should build with correct feeAssetId', () => {
    const faId = 'DbAik7g5NQcqTPPTiZnr97w4c6jjuahwjeDtTB7tJuQv';
    const tx = transfer({ ...transferMinimalParams, feeAssetId: faId }, stringSeed);
    expect(tx.feeAssetId).toEqual(faId);
  });

  it('Should build with correct attachment', () => {
    const att = '3vrgtyozxuY88J9RqMBBAci2UzAq9DBMFTpMWLPzMygGeSWnD7k';
    const tx = transfer({ ...transferMinimalParams, attachment: att }, stringSeed);
    expect(tx.attachment).toEqual(att);
  });

  it('Should build with null attachment', () => {
    const att = '';
    const tx = transfer({ ...transferMinimalParams, attachment: att }, stringSeed);
    expect(tx.attachment).toEqual(att);
  });

  it('Should not build with zero fee', () => {
    expect(() => transfer({ ...transferMinimalParams, fee: 0 }, stringSeed)).toThrowError(
      errorMessageByTemplate('fee', 0),
    );
  });

  it('Should not create with negative fee', () => {
    expect(() => transfer({ ...transferMinimalParams, fee: -1 }, stringSeed)).toThrowError(
      errorMessageByTemplate('fee', -1),
    );
  });

  it('Should not create with negative amount', () => {
    expect(() => transfer({ ...transferMinimalParams, amount: -1 }, stringSeed)).toThrowError(
      errorMessageByTemplate('amount', -1),
    );
  });
});

describe('serialize/deserialize transfer tx', () => {
  Object.entries(transferTx).forEach(([name, { Bytes, Json }]) => {
    it(name, () => {
      checkProtoSerializeDeserialize({ Bytes: Bytes, Json: Json });
    });
  });
});

describe('serialize/deserialize transfer binary tx', () => {
  Object.entries(transferBinaryTx).forEach(([name, { Bytes, Json }]) => {
    it(name, () => {
      checkBinarySerializeDeserialize({ Bytes: Bytes, Json: Json });
    });
  });
});

describe('proto round-trip: transfer with byte attachment', () => {
  const stringSeed = 'df3dd6d884714288a39af0bd973a1771c9f00f168cf040d6abb6a50dd5e055d8';

  it('preserves non-empty binary attachment through encode → decode', () => {
    // Use bytes that include non-printable chars so the test is not accidentally passing
    // because the attachment happened to be valid UTF-8 text.
    const binaryPayload = new Uint8Array([0x00, 0x01, 0xab, 0xff, 0x42]);
    const attachment = base58Encode(binaryPayload);
    const tx = transfer({ ...transferMinimalParams, attachment }, stringSeed);
    const protoBytes = txToProtoBytes(tx);
    const parsed = protoBytesToTx(protoBytes);
    expect(parsed.attachment).toBe(attachment);
  });

  it('preserves empty attachment through encode → decode', () => {
    const tx = transfer({ ...transferMinimalParams, attachment: '' }, stringSeed);
    const protoBytes = txToProtoBytes(tx);
    const parsed = protoBytesToTx(protoBytes);
    expect(parsed.attachment).toBe('');
  });
});
