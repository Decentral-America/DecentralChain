/** Available rounding modes for BigNumber arithmetic, matching bignumber.js semantics. */
export const ROUND_MODE = {
  ROUND_CEIL: 2,
  ROUND_DOWN: 1,
  ROUND_FLOOR: 3,
  ROUND_HALF_CEIL: 7,
  ROUND_HALF_DOWN: 5,
  ROUND_HALF_EVEN: 6,
  ROUND_HALF_FLOOR: 8,
  ROUND_HALF_UP: 4,
  ROUND_UP: 0,
} as const;
export type ROUND_MODE = (typeof ROUND_MODE)[keyof typeof ROUND_MODE];
