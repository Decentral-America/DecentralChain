export const compareUint8Arrays = (arr1, arr2) => {
  //  true  — arr1 is lexicographically greater
  //  false — arr2 is lexicographically greater (or equal)
  return arr1.toString('hex') > arr2.toString('hex');
};
