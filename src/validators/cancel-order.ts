import { getError, isBase58, isHash, isPublicKey, validateByShema } from './validators';

const cancelOrderScheme = {
  sender: isPublicKey,
  orderId: isHash,
  signature: isBase58,
  hash: isBase58,
};

export const cancelOrderValidator = validateByShema(cancelOrderScheme, getError);
