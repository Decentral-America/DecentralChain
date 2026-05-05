import { Joi } from '../../../../utils/validation';

import commonFields from '../../_common/commonFieldsSchemas';

export const result = Joi.object().keys({
  ...commonFields,

  amount: Joi.object().bignumber().required(),
  asset_id: Joi.string().assetId().required(),
  attachment: Joi.string().required().allow(''),
  fee_asset: Joi.string().assetId().required(),
  recipient: Joi.string().required(),
});
