import * as Long from "long";
import {Utf8ArrayToStr} from './libs/Utf8ArrayToStr'
import base58 from './libs/base58';
import {fromByteArray} from 'base64-js';

export const enum DATA_TRANSACTION_FIELD_TYPES {
  INTEGER,
  BOOLEAN,
  BINARY,
  STRING
}
export const ALIAS_VERSION: number = 2;


const LENGTH_SIZE = 2;
const LONG_BYTES_SIZE = 8;

const getDataTxFieldTypeByCode = (fieldTypeCode: any) => {
  switch (fieldTypeCode) {
    case DATA_TRANSACTION_FIELD_TYPES.INTEGER:
      return 'integer';
    case DATA_TRANSACTION_FIELD_TYPES.BOOLEAN:
      return 'boolean';
    case DATA_TRANSACTION_FIELD_TYPES.BINARY:
      return 'binary';
    case DATA_TRANSACTION_FIELD_TYPES.STRING:
      return 'string';
    default:
      throw new Error(`Unknown data field code ${fieldTypeCode}!`);
  }
};


export type parser<T> = (value: Uint8Array, start: number) => {value: T, shift: number}

export const P_OPTION = <T>(p: parser<T>) => (value: Uint8Array, start = 0) =>
  value[start] === 0 ? {value: undefined, shift: 1} : p(value, start + 1);

export const byteToLong = (shift: number) => (bytes: Uint8Array, start: number) => {
  const value = Long.fromBytesBE(Array.from(bytes.slice(start, start + shift)), true);
  return {value, shift};
};

export const byteToNumber = (shift: number) => (bytes: Uint8Array, start: number) => {
  const result = byteToLong(shift)(bytes, start);
  return {shift, value: result.value.toNumber()};
};

export const byteToBoolean = (bytes: Uint8Array, start: number) => {
  const value = !!bytes[start];
  return {value, shift: 1};
};

const byteToString = (shift: number) => (bytes: Uint8Array, start: number) => {
  const value = Utf8ArrayToStr(bytes.slice(start, start + shift))
  return {shift, value};
};

export const byteToStringWithLength = (bytes: Uint8Array, start: number) => {
  const lengthInfo = byteToNumber(LENGTH_SIZE)(bytes, start);
  const {value} = byteToString(lengthInfo.value)(bytes, start + LENGTH_SIZE);
  return {shift: lengthInfo.value + LENGTH_SIZE, value};
};

export const byteToBase58 = (bytes: Uint8Array, start: number, length?: number) => { // TODO!
  const shift = length || 32;
  const value = base58.encode(bytes.slice(start, start + shift));
  return {value, shift};
};

export const byteToAssetId = (bytes: Uint8Array, start: number) => {
  const shift = 33;
  //Todo what if assetId starts with 0 byte?
  const isWaves = !bytes[start];
  if (isWaves) {
    return {shift: 1, value: 'WAVES'};
  }
  const {value} = byteToBase58(bytes, start + 1);
  return {shift, value};
};

export const byteToAddressOrAlias = (bytes: Uint8Array, start: number) => {
  if (bytes[start] === ALIAS_VERSION) {
    const aliasData = byteToStringWithLength(bytes, start + 2);
    return {shift: aliasData.shift + 2, value: aliasData.value};
  } else {
    return byteToBase58(bytes, start, 26);
  }
};

export const byteNewAliasToString = (bytes: Uint8Array, start: number) => {
  const shift = byteToNumber(LENGTH_SIZE)(bytes, start).value + LENGTH_SIZE;
  const {value} = byteToStringWithLength(bytes, start + 4);
  return {shift, value};
};

export const byteToTransfers = (bytes: Uint8Array, start: number) => {
  const count = byteToNumber(LENGTH_SIZE)(bytes, start).value;
  const transfers = [];
  let shift = LENGTH_SIZE;

  for (let i = 0; i < count; i++) {
    const recipientData = byteToAddressOrAlias(bytes, start + shift);
    shift += recipientData.shift;
    const amountData = byteToLong(LONG_BYTES_SIZE)(bytes, start + shift);
    shift += amountData.shift;

    transfers.push({
      recipient: recipientData.value,
      amount: amountData.value
    });
  }

  return {shift, value: transfers};
};

export const byteToScript = (bytes: Uint8Array, start: number) => {
  const VERSION_LENGTH = 1;

  if (bytes[start] === 0) {
    return {shift: VERSION_LENGTH, value: 'base64:'};
  }

  const lengthInfo = byteToNumber(LENGTH_SIZE)(bytes, start + VERSION_LENGTH);
  const from = start + VERSION_LENGTH + lengthInfo.shift;
  const to = start + VERSION_LENGTH + lengthInfo.shift + lengthInfo.value;
  const value = `base64:${fromByteArray(bytes.slice(from, to))}`;

  return {value, shift: to - start};
};

export const byteToData = (bytes: Uint8Array, start: number) => {
  const count = getNumberFromBytes(bytes, LENGTH_SIZE, start);
  const fields = [];
  let shift = LENGTH_SIZE;

  for (let i = 0; i < count; i++) {

    const keyLength = getNumberFromBytes(bytes, LENGTH_SIZE, start + shift);
    shift += LENGTH_SIZE;
    const key = byteToString(keyLength)(bytes, start + shift).value;
    shift += keyLength;

    const fieldTypeCode = getNumberFromBytes(bytes, 1, start + shift);
    shift += 1;
    const type = getDataTxFieldTypeByCode(fieldTypeCode);
    let value;

    switch (fieldTypeCode) {
      case DATA_TRANSACTION_FIELD_TYPES.INTEGER:
        value = byteToLong(LONG_BYTES_SIZE)(bytes, start + shift).value;
        shift += LONG_BYTES_SIZE;
        break;
      case DATA_TRANSACTION_FIELD_TYPES.BOOLEAN:
        const booleanData = byteToBoolean(bytes, start + shift);
        value = booleanData.value;
        shift += booleanData.shift;
        break;
      case DATA_TRANSACTION_FIELD_TYPES.BINARY:
        const binaryLength = getNumberFromBytes(bytes, LENGTH_SIZE, start + shift);
        shift += LENGTH_SIZE;
        value = `base64:${fromByteArray(bytes.slice(start + shift, start + shift + binaryLength))}`;
        shift += binaryLength;
        break;
      case DATA_TRANSACTION_FIELD_TYPES.STRING:
        const length = getNumberFromBytes(bytes, LENGTH_SIZE, start + shift);
        shift += LENGTH_SIZE;
        value = byteToString(length)(bytes, start + shift).value;
        shift += length;
        break;
    }

    fields.push({key, type, value});
  }

  return {value: fields, shift};
};

export const getNumberFromBytes = (bytes: Uint8Array, length: number, start = 0) => {
  return byteToNumber(length)(bytes, start).value;
};
