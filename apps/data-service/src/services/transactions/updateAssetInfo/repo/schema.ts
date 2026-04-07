import { Joi } from '../../../../utils/validation';
import commonFields from '../../_common/commonFieldsSchemas';

export const result = Joi.object().keys({
  ...commonFields,

  asset_id: Joi.string().assetId().required(),
  asset_name: Joi.string().required(),
  description: Joi.string().required().allow(''),
});
