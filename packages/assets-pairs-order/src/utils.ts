/**
 * Compares two Uint8Arrays lexicographically, byte by byte.
 *
 * @param arr1 - First byte array
 * @param arr2 - Second byte array
 * @returns `true` if arr1 is lexicographically greater than arr2, `false` otherwise (including when equal)
 */
export const compareUint8Arrays = (arr1: Uint8Array, arr2: Uint8Array): boolean => {
  const len = Math.min(arr1.length, arr2.length);
  for (let i = 0; i < len; i++) {
    const a = arr1[i] as number;
    const b = arr2[i] as number;
    if (a > b) return true;
    if (a < b) return false;
  }
  return arr1.length > arr2.length;
};
