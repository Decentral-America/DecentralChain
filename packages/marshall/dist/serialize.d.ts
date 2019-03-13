import { TSerializer } from './serializePrimitives';
import { TSchema } from './schemaTypes';
export declare type TFromLongConverter<LONG> = (v: LONG) => string;
/**
 * Creates js to bytes converter for object from given schema
 * @param schema
 * @param fromLongConverter
 */
export declare const serializerFromSchema: <LONG = string | number>(schema: TSchema, fromLongConverter?: TFromLongConverter<LONG> | undefined) => TSerializer<any>;
export declare function serializeTx<LONG = string | number>(tx: any, fromLongConverter?: TFromLongConverter<LONG>): Uint8Array;
export declare function serializeOrder<LONG = string | number>(ord: any, fromLongConverter?: TFromLongConverter<LONG>): Uint8Array;
