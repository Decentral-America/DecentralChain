import {BYTE, SHORT, TSerializer} from "./serializePrimitives";
import {concat} from "./libs/utils";
import {ILongFactory, TSchema, txFields} from "./txSchemas";

export const serializerFromSchema = <LONG = string | number>(schema: TSchema, lf?: ILongFactory<LONG>): TSerializer<any> => (obj: any) => {
  let result = Uint8Array.from([]);

  let serializer: TSerializer<any>,
    itemBytes: Uint8Array;

  if (schema.type === 'array') {
    serializer = serializerFromSchema(schema.items, lf);
    itemBytes = concat(...obj.map((item: any) => serializer((item))));
    result = concat(result, SHORT(obj.length), itemBytes);
  }
  else if (schema.type === 'object') {
    schema.schema.forEach(field => {
      serializer = serializerFromSchema(field, lf);
      itemBytes = serializer(obj[field.name]);
      result = concat(result, itemBytes);
    });
  }
  else if (schema.type === 'anyOf') {
    const type = obj[schema.discriminant];
    const typeSchema = schema.items.get(type);
    if (typeSchema == null) {
      throw new Error(`Serializer Error: Unknown anyOf type: ${schema.discriminant}.${type}`)
    }
    const typeCode = [...schema.items.values()].findIndex(schema => schema === typeSchema);
    serializer = serializerFromSchema(typeSchema, lf);
    itemBytes = serializer(obj);
    result = concat(result, BYTE(typeCode), itemBytes);
  }
  else if (schema.type === 'primitive' || schema.type === undefined) {
    result = concat(result, schema.toBytes(obj));
  }
  else if (schema.type === 'dataTxField') {
    const keyBytes = txFields.stringField('').toBytes(obj.key);
    const type = obj.type;
    const typeSchema = schema.items.get(type);
    if (typeSchema == null) {
      throw new Error(`Serializer Error: Unknown dataTxField type: ${type}`)
    }
    const typeCode = [...schema.items.values()].findIndex(schema => schema === typeSchema);
    serializer = serializerFromSchema(typeSchema, lf);
    itemBytes = serializer(obj.value);
    result = concat(result, keyBytes, BYTE(typeCode), itemBytes)
  } else {
    throw new Error(`Serializer Error: Unknown schema type: ${schema!.type}`)
  }

  return result
};