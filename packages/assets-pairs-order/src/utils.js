/** @param {Uint8Array} arr1 @param {Uint8Array} arr2 @returns {boolean} */
export const compareUint8Arrays = (arr1, arr2) => {
  //  true  — arr1 is lexicographically greater
  //  false — arr2 is lexicographically greater (or equal)
  const len = Math.min(arr1.length, arr2.length);
  for (let i = 0; i < len; i++) {
    if (arr1[i] > arr2[i]) return true;
    if (arr1[i] < arr2[i]) return false;
  }
  return arr1.length > arr2.length;
};
