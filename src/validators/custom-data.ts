import {
  getError,
  ifElse,
  isArray,
  isBase64,
  isEq,
  isRequired,
  isValidDataPair,
  pipe,
  prop,
  validateByShema,
  validatePipe,
} from './validators';

const customDataV1Scheme = {
  binary: isBase64,
  version: isEq(1),
};

const customDataV2Scheme = {
  data: validatePipe(isArray, (data: Array<unknown>) =>
    data.every(validatePipe(isRequired(true), isValidDataPair)),
  ),
  version: isEq(2),
};

const v1Validator = validateByShema(customDataV1Scheme, getError);
const v2Validator = validateByShema(customDataV2Scheme, getError);

export const customDataValidator = ifElse(pipe(prop('version'), isEq(1)), v1Validator, v2Validator);
