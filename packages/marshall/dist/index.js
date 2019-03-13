"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schemas_1 = require("./schemas");
const serialize_1 = require("./serialize");
const parse_1 = require("./parse");
const json = require("./jsonMethods");
exports.json = json;
const serializePrimitives = require("./serializePrimitives");
exports.serializePrimitives = serializePrimitives;
const parsePrimitives = require("./parsePrimitives");
exports.parsePrimitives = parsePrimitives;
const schemas = require("./schemas");
exports.schemas = schemas;
const binary = {
    serializerFromSchema: serialize_1.serializerFromSchema,
    serializeTx: serialize_1.serializeTx,
    serializeOrder: serialize_1.serializeOrder,
    parserFromSchema: parse_1.parserFromSchema,
    parseTx: parse_1.parseTx,
    parseOrder: parse_1.parseOrder,
};
exports.binary = binary;
/**
 * Converts all LONG fields to another type with toConverter using schema. If no toConverter is provided LONG fields will be converted to strings.
 * If object contains custom LONG instances and this instances doesn't have toString method, you can provide fromConverter
 * @param obj
 * @param schema
 * @param toConverter - used to convert string to LONG. If not provided, string will be left as is
 * @param fromConverter - used to convert LONG to string. If not provided, toString will be called
 */
function convertLongFields(obj, schema, toConverter, fromConverter) {
    //ToDo: rewrite. Now simply serializes and then parses with long  factory to get right long types
    const ser = serialize_1.serializerFromSchema(schema, fromConverter);
    const par = parse_1.parserFromSchema(schema, toConverter);
    const converted = par(ser(obj)).value;
    return Object.assign({}, obj, converted);
}
exports.convertLongFields = convertLongFields;
function convertTxLongFields(tx, toConverter, fromConverter) {
    const { type, version } = tx;
    const schema = schemas_1.getTransactionSchema(type, version);
    return convertLongFields(tx, schema, toConverter, fromConverter);
}
exports.convertTxLongFields = convertTxLongFields;
//# sourceMappingURL=index.js.map