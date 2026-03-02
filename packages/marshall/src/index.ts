import { serializeOrder, serializerFromSchema, serializeTx } from './serialize';
import { parseHeader, parseOrder, parserFromSchema, parseTx } from './parse';
import * as json from './jsonMethods';
import * as serializePrimitives from './serializePrimitives';
import * as parsePrimitives from './parsePrimitives';
import * as schemas from './schemas';
import { convertLongFields, convertTxLongFields } from './convert';

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
  serializerFromSchema,
  serializeTx,
  serializeOrder,
  parserFromSchema,
  parseTx,
  parseOrder,
  parseHeader,
};

export type { TFromLongConverter } from './serialize';
export type { TToLongConverter } from './parse';

export {
  json,
  binary,
  schemas,
  serializePrimitives,
  parsePrimitives,
  convertLongFields,
  convertTxLongFields,
};
