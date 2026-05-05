import { createRequire } from 'node:module';

import { Effect } from 'effect';

import { createHttpHandler } from './_common';
import { HttpResponse } from './_common/types';
import { defaultStringify } from './_common/utils';

const _require = createRequire(import.meta.url);
const { version } = _require('../../package.json') as { version: string };

export default createHttpHandler(() =>
  Effect.succeed(
    HttpResponse.Ok(
      defaultStringify({
        docsUrl: process.env['DOCS_URL'] ? process.env['DOCS_URL'] : undefined,
        github: 'https://github.com/wavesplatform/data-service',
        version,
      }),
    ),
  ),
);
