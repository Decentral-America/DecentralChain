import { Effect } from 'effect';

import pkg from '../../package.json' with { type: 'json' };
import { createHttpHandler } from './_common';
import { HttpResponse } from './_common/types';
import { defaultStringify } from './_common/utils';

const { version } = pkg;

export default createHttpHandler(() =>
  Effect.succeed(
    HttpResponse.Ok(
      defaultStringify({
        status: 'ok',
        version,
      }),
    ),
  ),
);
