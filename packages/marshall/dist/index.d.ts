import { serializeOrder, serializeTx, TFromLongConverter } from './serialize';
import { parseOrder, parseTx, TToLongConverter } from './parse';
import * as json from './jsonMethods';
import * as serializePrimitives from './serializePrimitives';
import * as parsePrimitives from './parsePrimitives';
import * as schemas from './schemas';
import { TSchema } from './schemaTypes';
declare const binary: {
    serializerFromSchema: <LONG = string | number>(schema: TSchema, fromLongConverter?: TFromLongConverter<LONG> | undefined) => serializePrimitives.TSerializer<any>;
    serializeTx: typeof serializeTx;
    serializeOrder: typeof serializeOrder;
    parserFromSchema: <LONG = string>(schema: TSchema, toLongConverter?: TToLongConverter<LONG> | undefined) => parsePrimitives.TParser<any>;
    parseTx: typeof parseTx;
    parseOrder: typeof parseOrder;
};
export { TFromLongConverter, TToLongConverter, json, binary, schemas, serializePrimitives, parsePrimitives, convertLongFields, convertTxLongFields };
/**
 * Converts all LONG fields to another type with toConverter using schema. If no toConverter is provided LONG fields will be converted to strings.
 * If object contains custom LONG instances and this instances doesn't have toString method, you can provide fromConverter
 * @param obj
 * @param schema
 * @param toConverter - used to convert string to LONG. If not provided, string will be left as is
 * @param fromConverter - used to convert LONG to string. If not provided, toString will be called
 */
declare function convertLongFields<T = string, R = string>(obj: any, schema: TSchema, toConverter?: TToLongConverter<T>, fromConverter?: TFromLongConverter<R>): any;
declare function convertTxLongFields<T = string, R = string>(tx: any, toConverter?: TToLongConverter<T>, fromConverter?: TFromLongConverter<R>): any;
