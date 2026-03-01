import { getTransactionSchema } from './schemas';
import {
  serializeOrder,
  serializerFromSchema,
  serializeTx,
  type TFromLongConverter,
} from './serialize';
import { parseHeader, parseOrder, parserFromSchema, parseTx, type TToLongConverter } from './parse';
import * as json from './jsonMethods';
import * as serializePrimitives from './serializePrimitives';
import * as parsePrimitives from './parsePrimitives';
import * as schemas from './schemas';
import { type TSchema } from './schemaTypes';

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

/**
 * Converts all LONG fields to another type with toConverter using schema. If no toConverter is provided LONG fields will be converted to strings.
 * If object contains custom LONG instances and this instances doesn't have toString method, you can provide fromConverter
 * @param obj
 * @param schema
 * @param toConverter - used to convert string to LONG. If not provided, string will be left as is
 * @param fromConverter - used to convert LONG to string. If not provided, toString will be called
 */
function convertLongFields<T = string, R = string>(
  obj: any,
  schema: TSchema,
  toConverter?: TToLongConverter<T>,
  fromConverter?: TFromLongConverter<R>,
) {
  const ser = serializerFromSchema(schema, fromConverter);
  const par = parserFromSchema(schema, toConverter);
  const converted = par(ser(obj)).value;
  return { ...obj, ...converted };
}

/**
 * Converts all LONG fields in a transaction to another type using its schema.
 * Automatically resolves the schema from `tx.type` and `tx.version`.
 *
 * @param tx - The transaction object
 * @param toConverter - Converts string LONG values to the desired type
 * @param fromConverter - Converts custom LONG instances to string (defaults to `.toString()`)
 * @returns A new transaction object with converted LONG fields
 */
function convertTxLongFields<T = string, R = string>(
  tx: any,
  toConverter?: TToLongConverter<T>,
  fromConverter?: TFromLongConverter<R>,
) {
  const { type, version } = tx;
  const schema = getTransactionSchema(type, version);
  return convertLongFields(tx, schema, toConverter, fromConverter);
}
