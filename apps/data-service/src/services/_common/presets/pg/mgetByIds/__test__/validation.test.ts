import { Effect, Option, Schema } from 'effect';
import { identity } from 'ramda';
import { describe, expect, it } from 'vitest';
import { type PgDriver } from '../../../../../../db/driver';
import { mgetByIdsPreset } from '../../mgetByIds';

const createService = (resultSchema: Schema.Schema<any>) =>
  mgetByIdsPreset<string, string, string>({
    matchRequestResult: (req, res) => req === res,
    name: 'test_mget',
    resultSchema,
    sql: (ids: string[]) => ids.join(','),
    transformResult: identity,
  })({
    emitEvent: () => () => true,
    pg: {
      // pg.any receives the SQL string from sql(req), but we need to return
      // an array of "response rows" that matchRequestResult can match against.
      // In real usage, pg.any runs the SQL and returns rows. Here we simulate
      // by splitting the comma-joined ids back into an array.
      any: (_sql: string) => Effect.succeed(_sql.split(',')),
    } as unknown as PgDriver,
  });

describe('mgetByIds preset validation', () => {
  it('passes if correct object is provided', async () => {
    const service = createService(Schema.String);
    const result = await Effect.runPromise(service(['hello']));

    expect(result).toHaveLength(1);
    const first = result.at(0);
    expect(first).toBeDefined();
    if (first && Option.isSome(first)) {
      expect(first.value).toBe('hello');
    } else {
      expect.unreachable('Expected Option.Some');
    }
  });

  it('applies schema correctly — rejects invalid values', async () => {
    // Schema that only accepts the literal 'valid'
    const strictSchema = Schema.Literal('valid');
    const service = createService(strictSchema);

    // mget validates each Some value; if validation fails, the whole Effect fails
    // with a FiberFailure wrapping the ResolverError.
    let caught = false;
    try {
      await Effect.runPromise(service(['invalid']));
    } catch {
      caught = true;
    }
    expect(caught).toBe(true);
  });
});
