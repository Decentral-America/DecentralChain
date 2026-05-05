import { type CursorSerialization } from 'services/_common/pagination';
import { Joi } from '../../../../../../utils/validation';

const DATE0 = new Date(0);

export default <Cursor, Request, Response>(
  deserialize: CursorSerialization<Cursor, Request, Response>['deserialize'],
) =>
  Joi.object().keys({
    after: Joi.cursor().valid(deserialize),
    limit: Joi.number().min(1).max(100).required(),
    sort: Joi.string().valid('asc', 'desc'),
    timeEnd: Joi.when('timeStart', {
      is: Joi.exist(),
      otherwise: Joi.date().min(DATE0),
      then: Joi.date().min(Joi.ref('timeStart')),
    }),
    timeStart: Joi.date().min(DATE0),
  });
