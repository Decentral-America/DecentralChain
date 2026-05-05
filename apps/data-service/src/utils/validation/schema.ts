// @ts-nocheck
/**
 * Effect/Schema validators replacing the custom Joi v13 extension.
 *
 * Custom types match the semantics of the previous Joi extensions exactly:
 *   base58, assetId, noNullChars, saneForDbLike, eip712Signature,
 *   base64Prefixed, period (interval string), bignumber, bignumber int64,
 *   cursor (parametric – use makeCursorSchema).
 */

import { BigNumber } from '@decentralchain/data-entities';
import { Either, pipe, Schema } from 'effect';
import { type ValidationError } from '../../errorHandling';
import * as R from '../regex';

// ── string validators ──────────────────────────────────────────────────────

export const Base58 = pipe(
  Schema.String,
  Schema.filter((s) => R.base58.test(s), {
    identifier: 'Base58',
    message: () => 'must be a valid base58 string',
  }),
);

export const AssetId = pipe(
  Schema.String,
  Schema.filter((s) => R.assetId.test(s), {
    identifier: 'AssetId',
    message: () => 'must be a valid base58 string or "WAVES"',
  }),
);

export const NoNullChars = pipe(
  Schema.String,
  Schema.filter((s) => R.noNullChars.test(s), {
    identifier: 'NoNullChars',
    message: () => 'must not contain unicode null characters',
  }),
);

export const SaneForDbLike = pipe(
  Schema.String,
  Schema.filter((s) => R.saneForDbLike.test(s) && R.noNullChars.test(s), {
    // biome-ignore lint/security/noSecrets: false positive - Schema identifier, not a secret
    identifier: 'SaneForDbLike',
    message: () => 'must not end with an unescaped backslash',
  }),
);

export const Eip712Signature = pipe(
  Schema.String,
  Schema.filter((s) => R.eip712Signature.test(s), {
    // biome-ignore lint/security/noSecrets: false positive - Schema identifier, not a secret
    identifier: 'Eip712Signature',
    message: () => 'must be a hex-encoded string starting with `0x`',
  }),
);

export const Base64Prefixed = pipe(
  Schema.String,
  Schema.filter(
    (s) => {
      const colonIdx = s.indexOf(':');
      if (colonIdx === -1 || s.slice(0, colonIdx) !== 'base64') return false;
      const payload = s.slice(colonIdx + 1);
      // base64 alphabet + optional padding
      return /^[A-Za-z0-9+/]*={0,2}$/.test(payload);
    },
    {
      identifier: 'Base64Prefixed',
      // biome-ignore lint/security/noSecrets: false positive - this is a user-facing error message, not a secret
      message: () => 'must be a string of "base64:<base64EncodedString>"',
    },
  ),
);

/** Validates a period/interval string like "1m", "5h", "1d", "1M", "1Y". */
export const Period = pipe(
  Schema.String,
  Schema.filter((s) => R.interval.test(s), {
    identifier: 'Period',
    message: () => 'must be a valid interval string (e.g. 1m, 5h, 2d)',
  }),
);

/** Pair string like "WAVES/DCC" or "base58/base58". */
export const Pair = pipe(
  Schema.String,
  Schema.filter((s) => /^[A-Za-z0-9]+\/[A-Za-z0-9]+$/.test(s), {
    identifier: 'Pair',
    message: () => 'must be a valid pair string',
  }),
);

// ── BigNumber validators ───────────────────────────────────────────────────

export const Bignumber = Schema.instanceOf(BigNumber);

export const Bignumber64 = pipe(
  Schema.instanceOf(BigNumber),
  Schema.filter(
    (n) => {
      if (n.isNaN()) return false;
      // biome-ignore lint/security/noSecrets: false positive - these are Int64 range boundary constants, not secrets
      const LOWER = new BigNumber('-9223372036854775808');
      // biome-ignore lint/security/noSecrets: false positive - these are Int64 range boundary constants, not secrets
      const UPPER = new BigNumber('9223372036854775807');
      return n.gte(LOWER) && n.lte(UPPER);
    },
    {
      identifier: 'Bignumber64',
      message: 'is outside int64 range',
    },
  ),
);

// ── Cursor (parametric) ───────────────────────────────────────────────────

/**
 * Returns a Schema that validates a cursor string by running the provided
 * `deserialize` function against it. Valid iff `deserialize` returns Right.
 */
export const makeCursorSchema = <Cursor>(
  deserialize: (cursor: string) => Either.Either<ValidationError, Cursor>,
): Schema.Schema<string> =>
  pipe(
    Schema.String,
    Schema.filter((s) => Either.isRight(deserialize(s)), {
      identifier: 'Cursor',
      message: () => 'must be a valid cursor string',
    }),
  );
