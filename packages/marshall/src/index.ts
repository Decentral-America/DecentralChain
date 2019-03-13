import {getTransactionSchema} from './schemas'
import {serializeOrder, serializerFromSchema, serializeTx, TFromLongConverter} from './serialize'
import {parseOrder, parserFromSchema, parseTx, TToLongConverter} from './parse'
import * as json from './jsonMethods'
import * as serializePrimitives from './serializePrimitives'
import * as parsePrimitives from './parsePrimitives'
import * as schemas from './schemas'
import {TSchema} from './schemaTypes'

const binary = {
  serializerFromSchema,
  serializeTx,
  serializeOrder,
  parserFromSchema,
  parseTx,
  parseOrder,
}

export {
  TFromLongConverter,
  TToLongConverter,
  json,
  binary,
  schemas,
  serializePrimitives,
  parsePrimitives,
  convertLongFields,
  convertTxLongFields
}

/**
 * Converts all LONG fields to another type with toConverter using schema. If no toConverter is provided LONG fields will be converted to strings.
 * If object contains custom LONG instances and this instances doesn't have toString method, you can provide fromConverter
 * @param obj
 * @param schema
 * @param toConverter - used to convert string to LONG. If not provided, string will be left as is
 * @param fromConverter - used to convert LONG to string. If not provided, toString will be called
 */
function convertLongFields<T = string, R = string>(obj: any, schema: TSchema, toConverter?: TToLongConverter<T>, fromConverter?: TFromLongConverter<R>){
  //ToDo: rewrite. Now simply serializes and then parses with long  factory to get right long types
  const ser =  serializerFromSchema(schema, fromConverter)
  const par = parserFromSchema(schema, toConverter)
  const converted = par(ser(obj)).value
  return { ...obj, ...converted}
}

function convertTxLongFields<T = string, R = string>(tx: any, toConverter?: TToLongConverter<T>, fromConverter?: TFromLongConverter<R>) {
  const {type, version} = tx
  const schema = getTransactionSchema(type, version)
  return convertLongFields(tx, schema, toConverter, fromConverter)
}
