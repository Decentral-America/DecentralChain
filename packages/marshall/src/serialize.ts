import {BYTE, LEN, SHORT, TSerializer} from "./serializePrimitives";
import {concat} from "./libs/utils";
import {ILongFactory, orderSchemaV0, orderSchemaV2, txFields, getTransactionSchema} from "./schemas";
import {TSchema} from "./schemaTypes";

// FixMe: currently longfactory does nothing. Maybe we should remove it altogether
export const serializerFromSchema = <LONG = string | number>(schema: TSchema, lf?: ILongFactory<LONG>): TSerializer<any> => (obj: any) => {
  //let result = Uint8Array.from([]);

  let serializer: TSerializer<any>,
    itemBytes: Uint8Array;

  if (schema.type === 'array') {
    serializer = serializerFromSchema(schema.items, lf);
    itemBytes = concat(...obj.map((item: any) => serializer((item))));
    return concat((schema.toBytes || SHORT)(obj.length), itemBytes);
  }
  else if (schema.type === 'object') {
    let objBytes = Uint8Array.from([]);

    if (schema.optional && obj == null) {
      return Uint8Array.from([0])
    }

    schema.schema.forEach(field => {
      serializer = serializerFromSchema(field, lf);
      itemBytes = serializer(obj[field.name]);
      objBytes = concat(objBytes, itemBytes);
    });

    if (schema.withLength) objBytes = concat(SHORT(objBytes.length), objBytes);
    if (schema.optional) objBytes = concat([1], objBytes);

    return objBytes
  }
  else if (schema.type === 'anyOf') {
    const type = obj[schema.discriminatorField || 'type'];
    const typeSchema = schema.items.get(type);
    if (typeSchema == null) {
      throw new Error(`Serializer Error: Unknown anyOf type: ${schema.discriminatorField}.${type}`)
    }
    const typeCode = [...schema.items.values()].findIndex(schema => schema === typeSchema);
    serializer = serializerFromSchema(typeSchema, lf);
    itemBytes = serializer(obj[schema.valueField || 'value']);
    return concat((schema.toBytes || BYTE)(typeCode), itemBytes);
  }
  else if (schema.type === 'primitive' || schema.type === undefined) {
    return schema.toBytes(obj);
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
    return concat(keyBytes, BYTE(typeCode), itemBytes)
  } else {
    throw new Error(`Serializer Error: Unknown schema type: ${schema!.type}`)
  }

};

export function serializeTx<LONG = string | number>(tx: any, longFactory?: ILongFactory<LONG>): Uint8Array {
  const {type, version} = tx;
  const schema = getTransactionSchema(type, version);

  return serializerFromSchema(schema, longFactory)(tx);
}

export function serializeOrder<LONG = string | number>(ord: any, longFactory?: ILongFactory<LONG>): Uint8Array {
  const {version} = ord;
  const schema = version == 2 ? orderSchemaV2 : orderSchemaV0;
  return serializerFromSchema(schema, longFactory)(ord);
}