import { getTransactionSchema, orderVersionMap, type TRANSACTION_TYPE } from './schemas';
import { serializerFromSchema, type TFromLongConverter } from './serializeFromSchema';

export { serializerFromSchema, type TFromLongConverter };

/**
 * Serializes a DecentralChain transaction to binary bytes.
 * Automatically resolves the correct schema from `tx.type` and `tx.version`.
 *
 * @param tx - The transaction object to serialize
 * @param fromLongConverter - Optional converter for custom LONG types to string
 * @returns Binary representation as `Uint8Array`
 *
 * @example
 * ```typescript
 * const bytes = serializeTx({ type: 4, version: 2, ... });
 * ```
 */
export function serializeTx<LONG = string | number>(
  tx: object,
  fromLongConverter?: TFromLongConverter<LONG>,
): Uint8Array {
  const { type, version } = tx as Record<string, unknown>;
  const schema = getTransactionSchema(type as TRANSACTION_TYPE, version as number);

  return serializerFromSchema(schema, fromLongConverter)(tx);
}

/**
 * Serializes a DEX order to binary bytes.
 *
 * @param ord - The order object to serialize
 * @param fromLongConverter - Optional converter for custom LONG types to string
 * @returns Binary representation as `Uint8Array`
 *
 * @example
 * ```typescript
 * const bytes = serializeOrder({ version: 2, ... });
 * ```
 */
export function serializeOrder<LONG = string | number>(
  ord: object,
  fromLongConverter?: TFromLongConverter<LONG>,
): Uint8Array {
  const version = (ord as { version?: number }).version || 1;
  const schema = orderVersionMap[version];
  if (schema == null) throw new Error(`Unknown order version: ${version}`);
  return serializerFromSchema(schema, fromLongConverter)(ord);
}
