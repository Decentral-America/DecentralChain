import { parserFromSchema, type TToLongConverter } from './parse';
import { getTransactionSchema, type TRANSACTION_TYPE } from './schemas';
import { type TSchema } from './schemaTypes';
import { serializerFromSchema, type TFromLongConverter } from './serialize';

/**
 * Converts all LONG fields to another type with toConverter using schema. If no toConverter is provided LONG fields will be converted to strings.
 * If object contains custom LONG instances and this instances doesn't have toString method, you can provide fromConverter
 * @param obj
 * @param schema
 * @param toConverter - used to convert string to LONG. If not provided, string will be left as is
 * @param fromConverter - used to convert LONG to string. If not provided, toString will be called
 */
export function convertLongFields<T = string, R = string>(
  obj: Record<string, unknown>,
  schema: TSchema,
  toConverter?: TToLongConverter<T>,
  fromConverter?: TFromLongConverter<R>,
) {
  const ser = serializerFromSchema(schema, fromConverter);
  const par = parserFromSchema(schema, toConverter);
  const converted = par(ser(obj)).value;
  return { ...obj, ...(converted as Record<string, unknown>) };
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
export function convertTxLongFields<T = string, R = string>(
  tx: Record<string, unknown>,
  toConverter?: TToLongConverter<T>,
  fromConverter?: TFromLongConverter<R>,
) {
  const { type, version } = tx;
  const schema = getTransactionSchema(type as TRANSACTION_TYPE, version as number);
  return convertLongFields(tx, schema, toConverter, fromConverter);
}
