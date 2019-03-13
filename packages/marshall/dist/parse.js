"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parsePrimitives_1 = require("./parsePrimitives");
const utils_1 = require("./libs/utils");
const schemas_1 = require("./schemas");
/**
 * Creates Uint8Array parser from object schema. If toLongConverter is provided it will be used for all LONG primitives found in schema
 * @param schema
 * @param toLongConverter
 */
exports.parserFromSchema = (schema, toLongConverter) => (bytes, start = 0) => {
    let cursor = start;
    if (schema.type === 'array') {
        const result = [];
        const { value: len, shift } = (schema.fromBytes || parsePrimitives_1.P_SHORT)(bytes, start);
        cursor += shift;
        utils_1.range(0, len).forEach(_ => {
            const parser = exports.parserFromSchema(schema.items, toLongConverter);
            const { value, shift } = parser(bytes, cursor);
            result.push(value);
            cursor += shift;
        });
        return { value: result, shift: cursor - start };
    }
    else if (schema.type === 'object') {
        if (schema.optional) {
            const exists = bytes[cursor] === 1;
            cursor += 1;
            if (!exists)
                return { value: undefined, shift: 1 };
        }
        // skip object length, since we have schema of all its fields
        if (schema.withLength) {
            const lenInfo = schema.withLength.fromBytes(bytes, cursor);
            cursor += lenInfo.shift;
        }
        const result = {};
        schema.schema.forEach(field => {
            const [name, schema] = field;
            const parser = exports.parserFromSchema(schema, toLongConverter);
            const { value, shift } = parser(bytes, cursor);
            cursor += shift;
            if (value !== undefined) {
                // Name as array means than we need to save result to many object fields
                if (Array.isArray(name)) {
                    Object.assign(result, value);
                }
                else {
                    result[name] = value;
                }
            }
        });
        return { value: result, shift: cursor - start };
    }
    else if (schema.type === 'anyOf') {
        const typeInfo = (schema.fromBytes || parsePrimitives_1.P_BYTE)(bytes, cursor + schema.discriminatorBytePos);
        // Не увеличивать курсор, если объект пишется целиком с дискриминатором или дискриминатор не на 0 позиции.
        // Стоит убрать запись и чтение дискриминаторов из anyOf и вынес
        if (schema.valueField && schema.discriminatorBytePos === 0) {
            cursor += typeInfo.shift;
        }
        const item = schema.itemByByteKey(typeInfo.value);
        if (item == null) {
            throw new Error(`Failed to get schema for item with bytecode: ${typeInfo.value}`);
        }
        const parser = exports.parserFromSchema(item.schema, toLongConverter);
        const { value, shift } = parser(bytes, cursor);
        cursor += shift;
        return {
            // Checks if value should be written inside object. Eg. { type: 'int', value: 20}. Otherwise writes object directly. Eg. {type: 4, recipient: 'foo', timestamp:10000}
            value: schema.valueField ?
                { [schema.discriminatorField]: item.strKey, [schema.valueField]: value } :
                value,
            shift: cursor - start,
        };
    }
    else if (schema.type === 'dataTxField') {
        const key = parsePrimitives_1.byteToStringWithLength(bytes, cursor);
        cursor += key.shift;
        let dataType = parsePrimitives_1.P_BYTE(bytes, cursor);
        cursor += dataType.shift;
        const itemRecord = [...schema.items].find((_, i) => i === dataType.value);
        if (!itemRecord) {
            throw new Error(`Parser Error: Unknown dataTxField type: ${dataType.value}`);
        }
        const parser = exports.parserFromSchema(itemRecord[1], toLongConverter);
        const result = parser(bytes, cursor);
        //cursor += result.shift;
        return {
            value: {
                value: result.value,
                key: key.value,
                type: itemRecord[0],
            },
            shift: result.shift + key.shift + dataType.shift,
        };
    }
    else if (schema.type === 'primitive' || schema.type === undefined) {
        const parser = schema.fromBytes;
        let { value, shift } = parser(bytes, start);
        //Capture LONG Parser and convert strings desired instance if longFactory is present
        if (parser === parsePrimitives_1.P_LONG && toLongConverter) {
            value = toLongConverter(value);
        }
        return { value, shift: shift };
    }
    else {
        throw new Error(`Parser Error: Unknown schema type: ${schema.type}`);
    }
};
exports.parseHeader = (bytes) => {
    let shift = 0;
    let typeInfo = parsePrimitives_1.P_BYTE(bytes, shift);
    shift += typeInfo.shift;
    // ExchangeTransactionV2 have leading 0 in bodybytes
    if (typeInfo.value === 0) {
        typeInfo = parsePrimitives_1.P_BYTE(bytes, shift);
        shift += typeInfo.shift;
    }
    let versionInfo = parsePrimitives_1.P_BYTE(bytes, shift);
    return {
        type: typeInfo.value,
        version: versionInfo.value,
    };
};
/**
 * This function cannot parse transactions without version
 */
function parseTx(bytes, toLongConverter) {
    const { type, version } = exports.parseHeader(bytes);
    const schema = schemas_1.getTransactionSchema(type, version);
    return exports.parserFromSchema(schema, toLongConverter)(bytes).value;
}
exports.parseTx = parseTx;
/**
 * This function cannot parse OrderV1, which doesn't have version field
 */
function parseOrder(bytes, toLongConverter) {
    return exports.parserFromSchema(schemas_1.orderSchemaV2, toLongConverter)(bytes).value;
}
exports.parseOrder = parseOrder;
//# sourceMappingURL=parse.js.map