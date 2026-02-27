export const concat = (...arrays: (Uint8Array | number[])[]): Uint8Array => {
  // Pre-allocate buffer instead of spreading into intermediate arrays
  let totalLength = 0;
  for (const arr of arrays) totalLength += arr.length;
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr instanceof Uint8Array ? arr : arr, offset);
    offset += arr.length;
  }
  return result;
};

export const range = (start: number, end: number, step = 1): number[] =>
  Array.from({ length: end - start }).map((_, i) => i * step + start);
