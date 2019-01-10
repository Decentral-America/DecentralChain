import {ILongFactory} from "./schemas";
import {serializeOrder, serializerFromSchema, serializeTx} from "./serialize";
import {parseOrder, parserFromSchema, parseTx} from "./parse";
import * as json from "./jsonMethods";
import * as serializePrimitives from './serializePrimitives'
import * as parsePrimitives from './parsePrimitives'
import * as schemas from './schemas'

const binary = {
  serializerFromSchema,
  serializeTx,
  serializeOrder,
  parserFromSchema,
  parseTx,
  parseOrder
};

export {
  ILongFactory,
  json,
  binary,
  schemas,
  serializePrimitives,
  parsePrimitives,
  convertLongFields
}

function convertLongFields<T = string, R = string>(tx: any, toLf?: ILongFactory<T>, fromLf?: ILongFactory<R>) {
  return {...binary.parseTx(binary.serializeTx(tx, fromLf), toLf), proofs: tx.proofs}
}