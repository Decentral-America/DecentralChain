import { TParser } from './parsePrimitives';
import { TSchema } from './schemaTypes';
export declare type TToLongConverter<LONG> = (val: string) => LONG;
/**
 * Creates Uint8Array parser from object schema. If toLongConverter is provided it will be used for all LONG primitives found in schema
 * @param schema
 * @param toLongConverter
 */
export declare const parserFromSchema: <LONG = string>(schema: TSchema, toLongConverter?: TToLongConverter<LONG> | undefined) => TParser<any>;
export declare const parseHeader: (bytes: Uint8Array) => {
    type: number;
    version: number;
};
/**
 * This function cannot parse transactions without version
 */
export declare function parseTx<LONG = string>(bytes: Uint8Array, toLongConverter?: TToLongConverter<LONG>): any;
/**
 * This function cannot parse OrderV1, which doesn't have version field
 */
export declare function parseOrder<LONG = string>(bytes: Uint8Array, toLongConverter?: TToLongConverter<LONG>): any;
