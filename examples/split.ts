import { randomBytes, split } from '@decentralchain/ts-lib-crypto';

const bytes = randomBytes(2 + 3 + 4 + 10);
split(bytes, 2, 3, 4);

// [
//   Uint8Array [195, 206],
//   Uint8Array [ 10, 208, 171 ],
//   Uint8Array [ 36, 18, 254, 205 ],
//   Uint8Array [ 244, 232, 55, 11, 113, 47, 80, 194, 170, 216 ]
// ]

const [_a, _b, _c, _rest] = split(bytes, 2, 3, 4);

// a = Uint8Array [195, 206],
// b = Uint8Array [ 10, 208, 171 ],
// c = Uint8Array [ 36, 18, 254, 205 ],
// rest = Uint8Array [ 244, 232, 55, 11, 113, 47, 80, 194, 170, 216 ]
