import { convertLongFields, convertTxLongFields } from './convert';
import * as json from './jsonMethods';
import { parseHeader, parseOrder, parserFromSchema, parseTx } from './parse';
import * as parsePrimitives from './parsePrimitives';
import * as schemas from './schemas';
import { serializeOrder, serializerFromSchema, serializeTx } from './serialize';
import * as serializePrimitives from './serializePrimitives';

/**
 * Binary serialization and parsing utilities for DecentralChain transactions and orders.
 *
 * @example
 * ```typescript
 * import { binary } from '@decentralchain/marshall';
 *
 * const bytes = binary.serializeTx(tx);
 * const parsed = binary.parseTx(bytes);
 * ```
 */
const binary = {
  parseHeader,
  parseOrder,
  parserFromSchema,
  parseTx,
  serializeOrder,
  serializerFromSchema,
  serializeTx,
};

export type { TToLongConverter } from './parse';
export type { TFromLongConverter } from './serialize';

export {
  binary,
  convertLongFields,
  convertTxLongFields,
  json,
  parsePrimitives,
  schemas,
  serializePrimitives,
};
