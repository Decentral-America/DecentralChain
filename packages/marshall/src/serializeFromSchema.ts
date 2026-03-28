import { concat } from './libs/utils';
import { type DATA_FIELD_TYPE, type TSchema } from './schemaTypes';
import { BYTE, LEN, SHORT, STRING, type TSerializer } from './serializePrimitives';

export type TFromLongConverter<LONG> = (v: LONG) => string;

/**
 * Creates js to bytes converter for object from given schema
 * @param schema
 * @param fromLongConverter
 */
export const serializerFromSchema =
  <LONG = string | number>(
    schema: TSchema,
    fromLongConverter?: TFromLongConverter<LONG>,
  ): TSerializer<unknown> =>
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: binary protocol serializer with type discriminators
  (obj: unknown) => {
    let serializer: TSerializer<unknown>;
    let itemBytes: Uint8Array;

    if (schema.type === 'array') {
      serializer = serializerFromSchema(schema.items, fromLongConverter);
      itemBytes = concat(...(obj as unknown[]).map((item: unknown) => serializer(item)));
      return concat((schema.toBytes ?? SHORT)((obj as unknown[]).length), itemBytes);
    } else if (schema.type === 'object') {
      let objBytes: Uint8Array = new Uint8Array(0);

      if (schema.optional && obj == null) {
        return new Uint8Array([0]);
      }

      schema.schema.forEach((field) => {
        const [name, schema] = field;
        let data: unknown;
        // Name as array means than we need to serialize many js fields as one binary object. E.g. we need to add length
        if (Array.isArray(name)) {
          const result: Record<string, unknown> = {};
          for (const fieldName of name) {
            result[fieldName] = (obj as Record<string, unknown>)[fieldName];
          }
          data = result;
        } else {
          data = (obj as Record<string, unknown>)[name];
        }
        serializer = serializerFromSchema(schema, fromLongConverter);
        itemBytes = serializer(data);
        objBytes = concat(objBytes, itemBytes);
      });

      if (schema.withLength) {
        const l = schema.withLength.toBytes(objBytes.length);
        objBytes = concat(l, objBytes);
      }
      if (schema.optional) objBytes = concat([1], objBytes);

      return objBytes;
    } else if (schema.type === 'anyOf') {
      const rec = obj as { value?: unknown; [key: string]: unknown };
      const type = rec[schema.discriminatorField];
      const anyOfItem = schema.itemByKey(type as string);

      if (anyOfItem == null) {
        throw new Error(`Serializer Error: Unknown anyOf type: ${type}`);
      }

      // Boolean argument type: both 'true' and 'false' share the 'boolean' string key,
      // so we disambiguate by checking the actual value
      if (anyOfItem.strKey === 'boolean' && anyOfItem.key === 6 && rec.value === false)
        anyOfItem.key = 7;

      serializer = serializerFromSchema(anyOfItem.schema, fromLongConverter);

      // If object should be serialized as is. E.g.  {type: 20, signature, '100500'}
      if (schema.valueField == null) {
        return serializer(obj);
        // Otherwise we serialize field and write discriminator. Eg. {type: 'integer', value: 10000}
      } else {
        itemBytes = serializer(rec[schema.valueField]);
        return concat((schema.toBytes ?? BYTE)(anyOfItem.key), itemBytes);
      }
    } else if (schema.type === 'primitive' || schema.type === undefined) {
      return schema.toBytes(obj);
    } else if (schema.type === 'dataTxField') {
      const rec = obj as { key: string; type: string; value: unknown };
      const keyBytes = LEN(SHORT)(STRING)(rec.key);
      const type = rec.type;
      const typeSchema = schema.items.get(type as DATA_FIELD_TYPE);
      if (typeSchema == null) {
        throw new Error(`Serializer Error: Unknown dataTxField type: ${type}`);
      }
      const typeCode = [...schema.items.values()].indexOf(typeSchema);
      serializer = serializerFromSchema(typeSchema, fromLongConverter);
      itemBytes = serializer(rec.value);
      return concat(keyBytes, BYTE(typeCode), itemBytes);
    } /* v8 ignore next 3 - defensive guard for future schema types */ else {
      throw new Error(`Serializer Error: Unknown schema type: ${(schema as TSchema).type}`);
    }
  };
