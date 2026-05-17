import { SIGN_TYPES } from './constants';
import { type TSignData } from './interfaces';
import { prepare } from './prepare';
import { getValidateSchema } from './schemas';
import { type SIGN_TYPE } from './signType';

export default function (forSign: TSignData, networkByte: number): Uint8Array {
  const prepareMap = getValidateSchema(networkByte)[forSign.type];
  const version =
    forSign.data.version ??
    Object.keys(SIGN_TYPES[forSign.type].getBytes)
      .map(Number)
      .sort((a, b) => a - b)
      .pop();

  const dataForBytes = {
    ...prepare.signSchema(prepareMap)(forSign.data as object as Record<string, unknown>),
    ...forSign.data,
    type: forSign.type,
    version,
  };

  const convert = SIGN_TYPES[forSign.type as SIGN_TYPE].toNode || null;
  const signData = convert?.(dataForBytes, networkByte) || dataForBytes;
  const getBytesFn = SIGN_TYPES[forSign.type as SIGN_TYPE].getBytes[Number(version)];
  if (!getBytesFn) {
    throw new Error(`No getBytes function for type ${forSign.type} version ${version}`);
  }
  return getBytesFn(signData);
}
