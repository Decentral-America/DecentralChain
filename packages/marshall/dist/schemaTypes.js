"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DATA_FIELD_TYPE;
(function (DATA_FIELD_TYPE) {
    DATA_FIELD_TYPE["INTEGER"] = "integer";
    DATA_FIELD_TYPE["BOOLEAN"] = "boolean";
    DATA_FIELD_TYPE["STRING"] = "string";
    DATA_FIELD_TYPE["BINARY"] = "binary";
})(DATA_FIELD_TYPE = exports.DATA_FIELD_TYPE || (exports.DATA_FIELD_TYPE = {}));
function anyOf(items, options) {
    return new AnyOfClass(items, options);
}
exports.anyOf = anyOf;
class AnyOfClass {
    constructor(_items, options) {
        this._items = _items;
        this.type = 'anyOf';
        this.discriminatorField = 'type';
        this.discriminatorBytePos = 0; // defaults to 0
        Object.assign(this, options);
    }
    itemByKey(k) {
        // Here if k equals undefined (this happens of discriminator field is undefined), first item with no string key returns
        // This is useful for items without versions. E.g. orderV0
        const row = this._items.find(([key, schema, stringKey]) => stringKey === k || key == k);
        return row && {
            schema: row[1],
            key: row[0],
            strKey: row[2],
        };
    }
    itemByByteKey(k) {
        const row = this._items.find(([key, _]) => key === k);
        return row && {
            schema: row[1],
            key: row[0],
            strKey: row[2] || row[0].toString(10),
        };
    }
}
//# sourceMappingURL=schemaTypes.js.map