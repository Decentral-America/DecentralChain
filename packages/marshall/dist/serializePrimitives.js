"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base58_1 = require("./libs/base58");
const Base64 = require("base64-js");
const utils_1 = require("./libs/utils");
const Long = require("long");
const stringToUint8Array = (str) => Uint8Array.from([...unescape(encodeURIComponent(str))].map(c => c.charCodeAt(0)));
exports.empty = Uint8Array.from([]);
exports.zero = Uint8Array.from([0]);
exports.one = Uint8Array.from([1]);
exports.BASE58_STRING = (value) => base58_1.default.decode(value);
exports.BASE64_STRING = (value) => Base64.toByteArray(value.replace('base64:', ''));
exports.STRING = (value) => value ? stringToUint8Array(value) : exports.empty;
exports.BYTE = (value) => Uint8Array.from([value]);
exports.BOOL = (value) => exports.BYTE(value == true ? 1 : 0);
exports.BYTES = (value) => Uint8Array.from(value);
exports.SHORT = (value) => {
    const s = Long.fromNumber(value, true);
    return Uint8Array.from(s.toBytesBE().slice(6));
};
exports.INT = (value) => {
    const i = Long.fromNumber(value, true);
    return Uint8Array.from(i.toBytesBE().slice(4));
};
exports.OPTION = (s) => (value) => value == null
    || (typeof value == 'string' && value.length == 0)
    ? exports.zero : utils_1.concat(exports.one, s(value));
exports.LEN = (lenSerializer) => (valueSerializer) => (value) => {
    const data = valueSerializer(value);
    const len = lenSerializer(data.length);
    return utils_1.concat(len, data);
};
exports.COUNT = (countSerializer) => (itemSerializer) => (items) => {
    const data = utils_1.concat(...items.map(x => itemSerializer(x)));
    const len = countSerializer(items.length);
    return utils_1.concat(len, data);
};
exports.LONG = (value) => {
    let l;
    if (typeof value === 'number') {
        if (value > Math.pow(2, 53) - 1) {
            throw new Error(`${value} is too big to be precisely represented as js number. Use string instead`);
        }
        l = Long.fromNumber(value);
    }
    else {
        l = Long.fromString(value.toString());
    }
    return Uint8Array.from(l.toBytesBE());
};
exports.SCRIPT = (script) => exports.OPTION(exports.LEN(exports.SHORT)(exports.BASE64_STRING))(script ? script.slice(7) : null);
//# sourceMappingURL=serializePrimitives.js.map