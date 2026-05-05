import Joi from '../../../utils/validation/joi';

const result = Joi.object().keys({
  amount_asset_id: Joi.string().assetId().required(),
  first_price: Joi.object().bignumber().required(),
  high: Joi.object().bignumber().required(),
  last_price: Joi.object().bignumber().required(),
  low: Joi.object().bignumber().required(),
  price_asset_id: Joi.string().assetId().required(),
  quote_volume: Joi.object().bignumber().required(),
  txs_count: Joi.number().required(),
  volume: Joi.object().bignumber().required(),
  volume_waves: Joi.object().bignumber().required().allow(null),
  weighted_average_price: Joi.object().bignumber().required(),
});

export { result };
