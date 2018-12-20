import {schemasByTypeMap, ILongFactory, orderSchemaV0, orderSchemaV2,} from "./txSchemas";
import {serializerFromSchema} from "./serialize";
import {parseHeader, parserFromSchema} from "./parse";
import {txToJson} from "./txToJson";

export namespace binary {
  export function serializeTx<LONG = string | number>(tx: any, longFactory?: ILongFactory<LONG>): Uint8Array {
    const {type, version} = tx;
    const schema = getSchema(type, version);

    return serializerFromSchema(schema, longFactory)(tx);
  }

  /**
   * This function cannot transactions without version
   */
  export function parseTx<LONG = string>(bytes: Uint8Array, longFactory?: ILongFactory<LONG>) {
    const {type, version} = parseHeader(bytes);
    const schema = getSchema(type, version);

    return parserFromSchema(schema, longFactory)(bytes).value;
  }

  export function serializeOrder<LONG = string | number>(ord: any, longFactory?: ILongFactory<LONG>): Uint8Array {
    const { version } = ord;
    const schema = version == 2 ? orderSchemaV2 : orderSchemaV0;
    return serializerFromSchema(schema, longFactory)(ord);
  }

  /**
   * This function cannot parse OrderV1, which doesn't have version field
   */
  export function parseOrder<LONG = string>(bytes: Uint8Array, longFactory?: ILongFactory<LONG>) {
    return parserFromSchema(orderSchemaV2, longFactory)(bytes).value;
  }
}

export namespace json {
  export function parseTx<LONG = string>(str: string, lf?: ILongFactory<LONG>) {
    const safeStr = str.replace(/(".+?"[ \t\n]*:[ \t\n]*)(\d{15,})/gm, '$1"$2"');
    let tx = JSON.parse(safeStr);

    //ToDo: rewrite. Now simply serializes and then parses with long  factory to get right long types
    return lf ? convert(tx, lf) : tx
  }

  export function stringifyTx(tx: any): string {
    let txWithStrings = convert(tx);
    //TODO: remove this when contract invocation tx is fixed
    if (tx.type === 16){
      txWithStrings = tx
    }
    return txToJson(txWithStrings)
  }
}


export function convert<T = string, R = string>(tx: any, toLf?: ILongFactory<T>, fromLf?: ILongFactory<R>) {
  return {...binary.parseTx(binary.serializeTx(tx, fromLf), toLf), proofs: tx.proofs}
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