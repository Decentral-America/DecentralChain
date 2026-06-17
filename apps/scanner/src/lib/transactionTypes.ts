/**
 * DecentralChain transaction type number → human-readable name.
 * Source: /Ecosystem/docs/README.md — Transaction Types table.
 */
export const TX_TYPE_NAMES: Record<number, string> = {
  1: 'Genesis',
  2: 'Payment',
  3: 'Issue',
  4: 'Transfer',
  5: 'Reissue',
  6: 'Burn',
  7: 'Exchange',
  8: 'Lease',
  9: 'Lease Cancel',
  10: 'Create Alias',
  11: 'Mass Transfer',
  12: 'Data',
  13: 'Set Script',
  14: 'Sponsor Fee',
  15: 'Set Asset Script',
  16: 'Invoke Script',
  17: 'Update Asset Info',
  18: 'Ethereum',
};

export function txTypeName(type: number | null | undefined): string {
  if (type == null) return 'Unknown';
  return TX_TYPE_NAMES[type] ?? `Type ${type}`;
}
