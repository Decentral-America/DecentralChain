import { Joi } from '../../../utils/validation';

export default {
  fee: Joi.object().bignumber().required(),
  height: Joi.number().required(),
  id: Joi.string().base58().required(),
  proofs: Joi.array().required(),
  sender: Joi.string().base58().required(),
  sender_public_key: Joi.string().base58().required(),
  signature: Joi.string().base58().required().allow(null),
  status: Joi.string().required(),
  time_stamp: Joi.date().required(),
  tx_type: Joi.number().min(1).max(18).required(),
  tx_version: Joi.number().required().allow(null),
  uid: Joi.object().bignumber().required(),
};
