// @ts-nocheck
import { Joi } from '../../../../../utils/validation';
import { type CursorSerialization } from '../../../pagination';

export default <Cursor, Request, Response>(
  deserialize: CursorSerialization<Cursor, Request, Response>['deserialize'],
) => ({
  after: Joi.cursor().valid(deserialize),
  limit: Joi.number().min(1).max(100).required(),
});
