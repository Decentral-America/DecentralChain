import { getError, isNumber, isPublicKey, validateByShema } from './validators';

const authScheme = {
  publicKey: isPublicKey,
  timestamp: isNumber,
};

export const authValidator = validateByShema(authScheme, getError);
