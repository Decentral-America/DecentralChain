import { Joi } from '../../../../utils/validation';

export const result = Joi.object().keys({
  id: Joi.string().base58().required(),
  time_stamp: Joi.date().required(),
  tx_type: Joi.number().min(1).max(18).required(),
  uid: Joi.object().bignumber().required(),
});
