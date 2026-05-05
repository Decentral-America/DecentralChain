import { Effect, Option, Schema } from 'effect';
import { always, identity, T } from 'ramda';
import { type PgDriver } from '../../../../../../db/driver';
import { getByIdPreset } from '../../getById';

const createService = (resultSchema: Schema.Schema<any>) =>
  getByIdPreset<string, string, string>({
    name: 'some_name',
    resultSchema,
    sql: identity,
    transformResult: identity,
  })({
    emitEvent: always(T),
    pg: { oneOrNone: (id: string) => Effect.succeed(id) } as unknown as PgDriver,
  });

describe('getById', () => {
  describe('input validation', () => {
    const service = createService(Schema.String);

    it('passes if id param is a string', async () => {
      const result = await Effect.runPromise(service('someidgoeshere2942415'));
      expect(Option.isSome(result) ? result.value : null).toBe('someidgoeshere2942415');
    });
  });

  describe('result validation', () => {
    // Schema that only accepts 'qweasd'
    const strictSchema = Schema.Literal('qweasd');
    const service = createService(strictSchema);

    it('applies schema correctly — rejects invalid values', async () => {
      await expect(Effect.runPromise(service('someidgoeshere2942415'))).rejects.toBeDefined();
    });
  });
});
