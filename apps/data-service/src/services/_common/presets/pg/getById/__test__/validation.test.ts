import { of as taskOf } from 'folktale/concurrency/task';
import { type SchemaLike } from 'joi';
import { always, identity, T } from 'ramda';
import { type PgDriver } from '../../../../../../db/driver';
import { Joi } from '../../../../../../utils/validation';

import { getByIdPreset } from '../../getById';

const createService = (resultSchema: SchemaLike) =>
  getByIdPreset<string, string, string>({
    name: 'some_name',
    resultSchema,
    sql: identity,
    transformResult: identity,
  })({
    emitEvent: always(T),
    pg: { oneOrNone: (id: string) => taskOf(id) } as PgDriver,
  });

describe('getById', () => {
  describe('input validation', () => {
    // passing result validation
    const service = createService(Joi.any());

    it('passes if id param is a string', (done) =>
      service('someidgoeshere2942415')
        .run()
        .listen({
          onRejected: () => done.fail,
          onResolved: (x) => {
            expect(x).toBeJust('someidgoeshere2942415');
            done();
          },
        }));
  });

  describe('result validation', () => {
    // failing result validation
    const service = createService(Joi.any().valid('qweasd'));

    it('applies schema correctly', (done) =>
      service('someidgoeshere2942415')
        .run()
        .listen({
          onRejected: (e) => {
            expect(e.type).toBe('Resolver');
            done();
          },
        }));
  });
});
