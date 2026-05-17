import { getError, isAssetId, isBase58, isPublicKey, validateByShema } from './validators';

const cancelOrderScheme = {
  hash: isBase58,
  orderId: isAssetId,
  sender: isPublicKey,
  signature: isBase58,
};

export const cancelOrderValidator = validateByShema(cancelOrderScheme, getError);
