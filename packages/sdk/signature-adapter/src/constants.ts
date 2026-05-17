export const ERRORS = {
  NO_SUPPORTED_VERSIONS: 1,
  UNKNOWN_SIGN_TYPE: 0,
  VALIDATION_FAILED: 3,
  VERSION_IS_NOT_SUPPORTED: 2,
} as const;
export type ERRORS = (typeof ERRORS)[keyof typeof ERRORS];
