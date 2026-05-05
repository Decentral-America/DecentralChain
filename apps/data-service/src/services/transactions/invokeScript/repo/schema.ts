import { Joi } from '../../../../utils/validation';

import commonFields from '../../_common/commonFieldsSchemas';

export const result = Joi.object().keys({
  ...commonFields,
  call: Joi.object()
    .keys({
      args: Joi.array().items({
        type: Joi.string(),
        value: Joi.any(),
      }),
      function: Joi.string().noNullChars(),
    })
    .allow(null),
  dapp: Joi.string().required(),

  fee_asset_id: Joi.string().required(),
  payment: Joi.array().items({
    amount: Joi.object().bignumber().required(),
    assetId: Joi.string().assetId().required().allow(null),
  }),
});
