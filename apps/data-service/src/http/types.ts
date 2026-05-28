export const LSNFormat = {
  Number: 'number',
  String: 'string',
} as const;
export type LSNFormat = (typeof LSNFormat)[keyof typeof LSNFormat];

// LSN = large significand number
export type LSNSerialization = {
  lsnSerialization: LSNFormat;
};
