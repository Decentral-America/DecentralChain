import { type SIGN_TYPE, SIGN_TYPES, type TSignData } from './';
import { prepare } from './prepare';
import { getValidateSchema } from './schemas';

export default function (forSign: TSignData, networkByte: number): Uint8Array {
  const prepareMap = getValidateSchema(networkByte)[forSign.type];
  const version =
    forSign.data.version ||
    Object.keys(SIGN_TYPES[forSign.type].getBytes)
      .map(Number)
      .sort((a, b) => a - b)
      .pop();

  const dataForBytes = {
    ...prepare.signSchema(prepareMap)(forSign.data as unknown as Record<string, unknown>),
    ...forSign.data,
    version,
    type: forSign.type,
  };

  const convert = SIGN_TYPES[forSign.type as SIGN_TYPE].toNode || null;
  const signData = convert?.(dataForBytes, networkByte) || dataForBytes;
  const getBytesFn = SIGN_TYPES[forSign.type as SIGN_TYPE].getBytes[Number(version)];
  if (!getBytesFn) {
    throw new Error(`No getBytes function for type ${forSign.type} version ${version}`);
  }
  return getBytesFn(signData as Record<string, unknown>);
}
