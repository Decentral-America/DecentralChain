import { getError, isBase58, isHash, isPublicKey, validateByShema } from './validators';

const cancelOrderScheme = {
  hash: isBase58,
  orderId: isHash,
  sender: isPublicKey,
  signature: isBase58,
};

export const cancelOrderValidator = validateByShema(cancelOrderScheme, getError);
