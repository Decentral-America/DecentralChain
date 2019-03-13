import { TSchema } from './schemaTypes';
import { TToLongConverter } from './parse';
import { TFromLongConverter } from './serialize';
/**
 * Converts object to JSON string using binary schema. For every string found, it checks if given string is LONG property.
 * If true - function writes this string as number
 * @param obj
 * @param schema
 */
export declare function stringifyWithSchema(obj: any, schema?: TSchema): string;
/**
 * Safe parse json string to TX. Converts unsafe numbers to strings. Converts all LONG fields with converter if provided
 * @param str
 * @param toLongConverter
 */
export declare function parseTx<LONG = string>(str: string, toLongConverter?: TToLongConverter<LONG>): any;
/**
 * Converts transaction to JSON string.
 * If transaction contains custom LONG instances and this instances doesn't have toString method, you can provide converter as second param
 * @param tx
 * @param fromLongConverter
 */
export declare function stringifyTx<LONG>(tx: any, fromLongConverter?: TFromLongConverter<LONG>): string;
/**
 * Safe parse json string to order. Converts unsafe numbers to strings. Converts all LONG fields with converter if provided
 * @param str
 * @param toLongConverter
 */
export declare function parseOrder<LONG = string>(str: string, toLongConverter?: TToLongConverter<LONG>): any;
/**
 * Converts order to JSON string
 * If order contains custom LONG instances and this instances doesn't have toString method, you can provide converter as second param
 * @param ord
 * @param fromLongConverter
 */
export declare function stringifyOrder<LONG>(ord: any, fromLongConverter?: TFromLongConverter<LONG>): string;
