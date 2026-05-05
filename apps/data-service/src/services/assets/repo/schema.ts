import * as Joi from '../../../utils/validation/joi';

export const result = Joi.object().keys({
  asset_id: Joi.string().assetId().required(),
  asset_name: Joi.string().required(),
  decimals: Joi.number().required(),
  description: Joi.string().allow(''),
  has_script: Joi.boolean().required(),
  issue_height: Joi.number().required(),
  issue_timestamp: Joi.object().type(Date).required(),
  min_sponsored_asset_fee: Joi.object().bignumber().required().allow(null),
  reissuable: Joi.boolean().required(),
  sender: Joi.string().base58().allow('').required(),
  ticker: Joi.string().required().allow(null, ''),
  total_quantity: Joi.object().bignumber(),
});
