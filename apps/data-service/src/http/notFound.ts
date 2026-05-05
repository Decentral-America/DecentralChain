import { Effect } from 'effect';
import { createHttpHandler } from './_common';
import { HttpResponse } from './_common/types';

export default createHttpHandler(() => Effect.succeed(HttpResponse.NotFound()));
