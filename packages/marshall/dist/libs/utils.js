"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.concat = (...arrays) => arrays.reduce((a, b) => Uint8Array.from([...a, ...b]), new Uint8Array(0));
exports.range = (start, end, step = 1) => Array.from({ length: end - start })
    .map((_, i) => i * step + start);
//# sourceMappingURL=utils.js.map