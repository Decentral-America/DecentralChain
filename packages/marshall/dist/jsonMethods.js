"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create = require("parse-json-bignumber/dist/parse-json-bignumber");
const { parse, stringify } = create();
const schemas_1 = require("./schemas");
const serializePrimitives_1 = require("./serializePrimitives");
const index_1 = require("./index");
function resolvePath(path, obj) {
    if (path.length === 0)
        return obj;
    if (typeof obj !== 'object')
        return undefined;
    return resolvePath(path.slice(1), obj[path[0]]);
}
const isLongProp = (fullPath, fullSchema, targetObject) => {
    function go(path, schema) {
        if (schema == null)
            return false;
        if (path.length === 0 && (schema.type === 'primitive' || schema.type === undefined))
            return schema.toBytes === serializePrimitives_1.LONG;
        if (schema.type === 'object') {
            const field = schema.schema.find(([name, _]) => name === path[0]);
            return go(path.slice(1), field && field[1]);
        }
        if (schema.type === 'array') {
            return go(path.slice(1), schema.items);
        }
        if (schema.type === 'dataTxField') {
            if (path[0] !== 'value')
                return false;
            const dataObj = resolvePath(fullPath.slice(0, fullPath.length - 1), targetObject);
            const dataSchema = schema.items.get(dataObj.type);
            return go(path.slice(1), dataSchema);
        }
        if (schema.type === 'anyOf') {
            // Find object and get it's schema
            const obj = resolvePath(fullPath.slice(0, fullPath.length - 1), targetObject);
            const objType = obj[schema.discriminatorField];
            const objSchema = schema.itemByKey(objType);
            if (!objSchema)
                return false;
            if (schema.valueField != null) {
                return go(path.slice(1), objSchema.schema);
            }
            else {
                return go(path, objSchema.schema);
            }
        }
        return false;
    }
    return go(fullPath, fullSchema);
};
/**
 * Converts object to JSON string using binary schema. For every string found, it checks if given string is LONG property.
 * If true - function writes this string as number
 * @param obj
 * @param schema
 */
function stringifyWithSchema(obj, schema) {
    const path = [];
    const stack = [];
    function stringifyValue(value) {
        if (typeof value === 'string') {
            if (isLongProp(path, schema, obj)) {
                return value;
            }
        }
        if (typeof value === 'boolean' || value instanceof Boolean ||
            value === null ||
            typeof value === 'number' || value instanceof Number ||
            typeof value === 'string' || value instanceof String ||
            value instanceof Date) {
            return JSON.stringify(value);
        }
        if (Array.isArray(value)) {
            return stringifyArray(value);
        }
        if (value && typeof value === 'object') {
            return stringifyObject(value);
        }
        return undefined;
    }
    function stringifyArray(array) {
        let str = '[';
        const stackIndex = stack.length;
        stack[stackIndex] = array;
        for (let i = 0; i < array.length; i++) {
            let key = i + '';
            let item = array[i];
            if (typeof item !== 'undefined' && typeof item !== 'function') {
                path[stackIndex] = key;
                str += stringifyValue(item);
            }
            else {
                str += 'null';
            }
            if (i < array.length - 1) {
                str += ',';
            }
        }
        stack.length = stackIndex;
        path.length = stackIndex;
        str += ']';
        return str;
    }
    function stringifyObject(object) {
        let first = true;
        let str = '{';
        const stackIndex = stack.length;
        stack[stackIndex] = object;
        for (let key in object) {
            if (object.hasOwnProperty(key)) {
                let value = object[key];
                if (includeProperty(value)) {
                    if (first) {
                        first = false;
                    }
                    else {
                        str += ',';
                    }
                    str += ('"' + key + '":');
                    path[stackIndex] = key;
                    str += stringifyValue(value);
                }
            }
        }
        stack.length = stackIndex;
        path.length = stackIndex;
        str += '}';
        return str;
    }
    function includeProperty(value) {
        return typeof value !== 'undefined'
            && typeof value !== 'function';
    }
    return stringifyValue(obj) || '';
}
exports.stringifyWithSchema = stringifyWithSchema;
/**
 * Safe parse json string to TX. Converts unsafe numbers to strings. Converts all LONG fields with converter if provided
 * @param str
 * @param toLongConverter
 */
function parseTx(str, toLongConverter) {
    const tx = parse(str);
    return toLongConverter ? index_1.convertTxLongFields(tx, toLongConverter) : tx;
}
exports.parseTx = parseTx;
/**
 * Converts transaction to JSON string.
 * If transaction contains custom LONG instances and this instances doesn't have toString method, you can provide converter as second param
 * @param tx
 * @param fromLongConverter
 */
function stringifyTx(tx, fromLongConverter) {
    const { type, version } = tx;
    const schema = schemas_1.getTransactionSchema(type, version);
    const txWithStrings = index_1.convertLongFields(tx, schema, undefined, fromLongConverter);
    return stringifyWithSchema(txWithStrings, schema);
}
exports.stringifyTx = stringifyTx;
/**
 * Safe parse json string to order. Converts unsafe numbers to strings. Converts all LONG fields with converter if provided
 * @param str
 * @param toLongConverter
 */
function parseOrder(str, toLongConverter) {
    const ord = parse(str);
    const schema = ord.version === 2 ? schemas_1.orderSchemaV2 : schemas_1.orderSchemaV0;
    return toLongConverter ? index_1.convertLongFields(ord, schema, toLongConverter) : ord;
}
exports.parseOrder = parseOrder;
/**
 * Converts order to JSON string
 * If order contains custom LONG instances and this instances doesn't have toString method, you can provide converter as second param
 * @param ord
 * @param fromLongConverter
 */
function stringifyOrder(ord, fromLongConverter) {
    const schema = ord.version === 2 ? schemas_1.orderSchemaV2 : schemas_1.orderSchemaV0;
    const ordWithStrings = index_1.convertLongFields(ord, schema, undefined, fromLongConverter);
    return stringifyWithSchema(ordWithStrings, schema);
}
exports.stringifyOrder = stringifyOrder;
//# sourceMappingURL=jsonMethods.js.map