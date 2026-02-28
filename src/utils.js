/**
 * Compares two Uint8Arrays lexicographically, byte by byte.
 *
 * @param {Uint8Array} arr1 - First byte array
 * @param {Uint8Array} arr2 - Second byte array
 * @returns {boolean} `true` if arr1 is lexicographically greater than arr2, `false` otherwise (including when equal)
 */
export const compareUint8Arrays = (arr1, arr2) => {
  const len = Math.min(arr1.length, arr2.length);
  for (let i = 0; i < len; i++) {
    if (arr1[i] > arr2[i]) return true;
    if (arr1[i] < arr2[i]) return false;
  }
  return arr1.length > arr2.length;
};
