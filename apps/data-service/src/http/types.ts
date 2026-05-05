export const LSNFormat = {
  Number: 'number',
  String: 'string',
} as const;
export type LSNFormat = (typeof LSNFormat)[keyof typeof LSNFormat];

// @todo could we make safer intersection?
// LSN = large significand number
export type LSNSerialization = {
  lsnSerialization: LSNFormat;
};
