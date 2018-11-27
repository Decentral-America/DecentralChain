import {schemasByTypeMap, serializerFromSchema, parserFromSchema, parseHeader, ILongFactory,} from "./txSchemas";

export function serialize<LONG = string | number>(tx: any, longFactory?: ILongFactory<LONG>): Uint8Array {
  const {type, version} = tx;
  const schema = getSchema(type, version);

  return serializerFromSchema(schema, longFactory)(tx);
}

export function parse<LONG = string>(bytes: Uint8Array, longFactory?: ILongFactory<LONG>) {
  const {type, version} = parseHeader(bytes);
  const schema = getSchema(type, version);

  return parserFromSchema(schema, longFactory)(bytes);
}

function getSchema(type: number, version?: number) {
  const schemas = (<any>schemasByTypeMap)[type];
  if (typeof schemas !== 'object') {
    throw new Error(`Incorrect tx type: ${type}`)
  }

  const schema = schemas[version || 0];
  if (typeof schema !== 'object') {
    throw new Error(`Incorrect tx version: ${version}`)
  }

  return schema
}