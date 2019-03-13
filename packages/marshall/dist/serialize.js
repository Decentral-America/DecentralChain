"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serializePrimitives_1 = require("./serializePrimitives");
const utils_1 = require("./libs/utils");
const schemas_1 = require("./schemas");
/**
 * Creates js to bytes converter for object from given schema
 * @param schema
 * @param fromLongConverter
 */
// FixMe: currently fromLongConverter does nothing. Maybe we should remove it altogether
exports.serializerFromSchema = (schema, fromLongConverter) => (obj) => {
    //let result = Uint8Array.from([]);
    let serializer, itemBytes;
    if (schema.type === 'array') {
        serializer = exports.serializerFromSchema(schema.items, fromLongConverter);
        itemBytes = utils_1.concat(...obj.map((item) => serializer((item))));
        return utils_1.concat((schema.toBytes || serializePrimitives_1.SHORT)(obj.length), itemBytes);
    }
    else if (schema.type === 'object') {
        let objBytes = Uint8Array.from([]);
        if (schema.optional && obj == null) {
            return Uint8Array.from([0]);
        }
        schema.schema.forEach(field => {
            const [name, schema] = field;
            let data;
            // Name as array means than we need to serialize many js fields as one binary object. E.g. we need to add length
            if (Array.isArray(name)) {
                data = name.reduce((acc, fieldName) => (Object.assign({}, acc, { [fieldName]: obj[fieldName] })), {});
            }
            else {
                data = obj[name];
            }
            serializer = exports.serializerFromSchema(schema, fromLongConverter);
            itemBytes = serializer(data);
            objBytes = utils_1.concat(objBytes, itemBytes);
        });
        if (schema.withLength) {
            const l = schema.withLength.toBytes(objBytes.length);
            objBytes = utils_1.concat(l, objBytes);
        }
        if (schema.optional)
            objBytes = utils_1.concat([1], objBytes);
        return objBytes;
    }
    else if (schema.type === 'anyOf') {
        const type = obj[schema.discriminatorField];
        const anyOfItem = schema.itemByKey(type);
        if (anyOfItem == null) {
            throw new Error(`Serializer Error: Unknown anyOf type: ${type}`);
        }
        serializer = exports.serializerFromSchema(anyOfItem.schema, fromLongConverter);
        // If object should be serialized as is. E.g.  {type: 20, signature, '100500'}
        if (schema.valueField == null) {
            return serializer(obj);
            // Otherwise we serialize field and write discriminator. Eg. {type: 'integer', value: 10000}
        }
        else {
            itemBytes = serializer(obj[schema.valueField]);
            return utils_1.concat((schema.toBytes || serializePrimitives_1.BYTE)(anyOfItem.key), itemBytes);
        }
    }
    else if (schema.type === 'primitive' || schema.type === undefined) {
        return schema.toBytes(obj);
    }
    else if (schema.type === 'dataTxField') {
        const keyBytes = serializePrimitives_1.LEN(serializePrimitives_1.SHORT)(serializePrimitives_1.STRING)(obj.key);
        const type = obj.type;
        const typeSchema = schema.items.get(type);
        if (typeSchema == null) {
            throw new Error(`Serializer Error: Unknown dataTxField type: ${type}`);
        }
        const typeCode = [...schema.items.values()].findIndex(schema => schema === typeSchema);
        serializer = exports.serializerFromSchema(typeSchema, fromLongConverter);
        itemBytes = serializer(obj.value);
        return utils_1.concat(keyBytes, serializePrimitives_1.BYTE(typeCode), itemBytes);
    }
    else {
        throw new Error(`Serializer Error: Unknown schema type: ${schema.type}`);
    }
};
function serializeTx(tx, fromLongConverter) {
    const { type, version } = tx;
    const schema = schemas_1.getTransactionSchema(type, version);
    return exports.serializerFromSchema(schema, fromLongConverter)(tx);
}
exports.serializeTx = serializeTx;
function serializeOrder(ord, fromLongConverter) {
    const { version } = ord;
    const schema = version == 2 ? schemas_1.orderSchemaV2 : schemas_1.orderSchemaV0;
    return exports.serializerFromSchema(schema, fromLongConverter)(ord);
}
exports.serializeOrder = serializeOrder;
//# sourceMappingURL=serialize.js.map