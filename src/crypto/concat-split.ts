import { type TBinaryIn, type TBytes } from './interface';
import { _fromIn } from '../conversions/param';

/** Concatenate multiple binary inputs into a single Uint8Array. */
/** Concatenate multiple binary inputs into a single `Uint8Array`. */
export const concat = (...arrays: TBinaryIn[]): TBytes => {
  const parts = arrays.map(_fromIn);
  const totalLength = parts.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

/** Split binary data into segments of the specified sizes. Remaining bytes form the last segment. */
export const split = (binary: TBinaryIn, ...sizes: number[]): TBytes[] => {
  const { r, arr } = sizes.reduce<{ arr: TBytes; r: TBytes[] }>(
    (a, s) => ({ arr: a.arr.slice(s), r: [...a.r, a.arr.slice(0, s)] }),
    { arr: _fromIn(binary), r: [] },
  );
  return [...r, arr];
};
