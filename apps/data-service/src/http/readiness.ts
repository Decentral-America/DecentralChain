import { Effect, Either, pipe } from 'effect';

import { type PgDriver } from '../db/driver';
import { defaultStringify } from './_common/utils';

const headersJson = { 'Content-Type': 'application/json; charset=utf-8' };

/**
 * Returns a Hono-compatible handler for GET /readiness.
 *
 * Returns HTTP 200 {"status":"ready"} when the database pool can execute
 * a lightweight ping query (`SELECT 1`), and HTTP 503 {"status":"unavailable"}
 * otherwise.  Intentionally NOT using createHttpHandler — this route must
 * never throw; it always resolves with a deterministic status code.
 */
export const createReadinessHandler = (pgDriver: PgDriver) => async (): Promise<Response> => {
  const result = await Effect.runPromise(pipe(pgDriver.none('SELECT 1'), Effect.either));

  if (Either.isRight(result)) {
    return new Response(defaultStringify({ status: 'ready' }), {
      headers: headersJson,
      status: 200,
    });
  }

  return new Response(defaultStringify({ status: 'unavailable' }), {
    headers: headersJson,
    status: 503,
  });
};
