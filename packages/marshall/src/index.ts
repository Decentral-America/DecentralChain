import {schemasByTypeMap, ILongFactory,} from "./txSchemas";
import {serializerFromSchema} from "./serialize";
import {parseHeader, parserFromSchema} from "./parse";
import {txToJson} from "./txToJson";

export function serialize<LONG = string | number>(tx: any, longFactory?: ILongFactory<LONG>): Uint8Array {
  const {type, version} = tx;
  const schema = getSchema(type, version);

  return serializerFromSchema(schema, longFactory)(tx);
}

export function parse<LONG = string>(bytes: Uint8Array, longFactory?: ILongFactory<LONG>) {
  const {type, version} = parseHeader(bytes);
  const schema = getSchema(type, version);

  return parserFromSchema(schema, longFactory)(bytes).value;
}

export function parseJSON<LONG = string>(str: string, lf?: ILongFactory<LONG>) {
  const safeStr = str.replace(/(".+?"[ \t\n]*:[ \t\n]*)(\d{15,})/gm, '$1"$2"');
  let tx = JSON.parse(safeStr);

  //ToDo: rewrite. Now simply serializes and then parses with long  factory to get right long types
  return lf ? convert(tx, lf) : tx
}

export function stringify(tx: any): string {
  const txWithStrings = convert(tx);
  return txToJson(txWithStrings)
}


export function convert<T = string, R = string>(tx: any, toLf?: ILongFactory<T>, fromLf?: ILongFactory<R>) {
  return parse(serialize(tx, fromLf), toLf)
}

export function getSchema(type: number, version?: number) {
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