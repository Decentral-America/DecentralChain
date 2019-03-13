"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Long = require("long");
const Utf8ArrayToStr_1 = require("./libs/Utf8ArrayToStr");
const base58_1 = require("./libs/base58");
const Base64 = require("base64-js");
exports.ALIAS_VERSION = 2;
const LENGTH_SIZE = 2;
exports.P_OPTION = (p) => (bytes, start = 0) => {
    if (bytes[start] === 0)
        return { value: null, shift: 1 };
    const result = p(bytes, start + 1);
    return { value: result.value, shift: result.shift + 1 };
};
exports.P_BYTE = (bytes, start = 0) => ({ value: bytes[start], shift: 1 });
exports.P_SHORT = (bytes, start = 0) => ({ value: 256 * bytes[start] + bytes[start + 1], shift: 2 });
exports.P_INT = (bytes, start = 0) => ({ value: Math.pow(2, 24) * bytes[start] + Math.pow(2, 16) * bytes[start + 1] + Math.pow(2, 8) * bytes[start + 2] + bytes[start + 3], shift: 4 });
exports.P_LONG = (bytes, start = 0) => ({
    value: Long.fromBytesBE(Array.from(bytes.slice(start, start + 8))).toString(),
    shift: 8,
});
exports.P_BOOLEAN = (bytes, start = 0) => {
    const value = !!bytes[start];
    return { value, shift: 1 };
};
exports.P_STRING_FIXED = (len) => (bytes, start = 0) => {
    const value = Utf8ArrayToStr_1.Utf8ArrayToStr(bytes.slice(start, start + len));
    return { shift: len, value };
};
exports.P_STRING_VAR = (lenParser) => (bytes, start = 0) => {
    const lengthInfo = lenParser(bytes, start);
    const { value } = exports.P_STRING_FIXED(lengthInfo.value)(bytes, start + lengthInfo.shift);
    return { shift: lengthInfo.value + lengthInfo.shift, value };
};
exports.P_BASE58_FIXED = (len) => (bytes, start = 0) => {
    const value = base58_1.default.encode(bytes.slice(start, start + len));
    return { value, shift: len };
};
exports.P_BASE58_VAR = (lenParser) => (bytes, start = 0) => {
    const lengthInfo = lenParser(bytes, start);
    const { value } = exports.P_BASE58_FIXED(lengthInfo.value)(bytes, start + LENGTH_SIZE);
    return { shift: lengthInfo.value + LENGTH_SIZE, value };
};
exports.P_BASE64 = (lenParser) => (bytes, start = 0) => {
    const lengthInfo = lenParser(bytes, start);
    const value = `base64:${Base64.fromByteArray(bytes.slice(start + lengthInfo.shift, start + lengthInfo.shift + lengthInfo.value))}`;
    return { shift: lengthInfo.value + lengthInfo.shift, value };
};
const byteToString = (shift) => (bytes, start) => {
    const value = Utf8ArrayToStr_1.Utf8ArrayToStr(bytes.slice(start, start + shift));
    return { shift, value };
};
exports.byteToStringWithLength = (bytes, start = 0) => {
    const lengthInfo = exports.P_SHORT(bytes, start);
    const { value } = byteToString(lengthInfo.value)(bytes, start + LENGTH_SIZE);
    return { shift: lengthInfo.value + LENGTH_SIZE, value };
};
exports.byteToBase58 = (bytes, start = 0, length) => {
    const shift = length || 32;
    const value = base58_1.default.encode(bytes.slice(start, start + shift));
    return { value, shift };
};
exports.byteToBase58WithLength = (bytes, start = 0) => {
    const lenInfo = exports.P_SHORT(bytes, start);
    const value = base58_1.default.encode(bytes.slice(start + lenInfo.shift, start + lenInfo.shift + lenInfo.value));
    return { value, shift: lenInfo.shift + lenInfo.value };
};
exports.byteToAddressOrAlias = (bytes, start = 0) => {
    if (bytes[start] === exports.ALIAS_VERSION) {
        const aliasData = exports.byteToStringWithLength(bytes, start + 2);
        return { shift: aliasData.shift + 2, value: aliasData.value };
    }
    else {
        return exports.byteToBase58(bytes, start, 26);
    }
};
exports.byteNewAliasToString = (bytes, start = 0) => {
    const shift = exports.P_SHORT(bytes, start).value + LENGTH_SIZE;
    const { value } = exports.byteToStringWithLength(bytes, start);
    return { shift, value };
};
exports.byteToScript = (bytes, start = 0) => {
    const VERSION_LENGTH = 1;
    if (bytes[start] === 0) {
        return { shift: VERSION_LENGTH, value: null };
    }
    const lengthInfo = exports.P_SHORT(bytes, start + VERSION_LENGTH);
    const from = start + VERSION_LENGTH + lengthInfo.shift;
    const to = start + VERSION_LENGTH + lengthInfo.shift + lengthInfo.value;
    const value = `base64:${Base64.fromByteArray(bytes.slice(from, to))}`;
    return { value, shift: to - start };
};
//# sourceMappingURL=parsePrimitives.js.map