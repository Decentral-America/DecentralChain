import { of as taskOf } from 'folktale/concurrency/task';
import { type SchemaLike } from 'joi';
import { always, equals, identity, T } from 'ramda';
import { type PgDriver } from '../../../../../../db/driver';
import { Joi } from '../../../../../../utils/validation';
import { mgetByIdsPreset } from '../../mgetByIds';

const createService = (resultSchema: SchemaLike) =>
  mgetByIdsPreset<string, string, string>({
    matchRequestResult: equals,
    name: 'some_name',
    resultSchema,
    sql: (s: string[]) => s.join(';'),
    transformResult: identity,
  })({
    emitEvent: always(T),
    pg: {
      any: (ids) => taskOf(ids.split(';')),
    } as PgDriver,
  });

describe('mgetByIds', () => {
  describe('input validation', () => {
    // passing result validation
    const service = createService(Joi.any());

    it('passes if ids param is an empty array', (done) =>
      service([])
        .run()
        .listen({
          onResolved: (x) => {
            expect(x).toBeInstanceOf(Array);
            done();
          },
        }));
    it('passes if ids param is a base58 string array', (done) =>
      service(['someidgoeshere2942415', 'qwe', 'asd'])
        .run()
        .listen({
          onResolved: (x) => {
            expect(x).toBeInstanceOf(Array);
            done();
          },
        }));
  });

  describe('result validation', () => {
    // failing result validation
    const service = createService(Joi.any().valid('qweasd'));

    it('applies schema correctly', (done) =>
      service(['someidgoeshere2942415'])
        .run()
        .listen({
          onRejected: (e) => {
            expect(e.type).toBe('Resolver');
            done();
          },
          onResolved: console.log,
        }));
  });
});
