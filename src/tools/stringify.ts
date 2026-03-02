const FIELDS: string[] = [
  'amount',
  'matcherFee',
  'price',
  'fee',
  'minSponsoredAssetFee',
  'quantity',
  'sellMatcherFee',
  'buyMatcherFee',
];

export default function <T extends object>(data: T): string {
  return JSON.stringify(
    data,
    function (this: Record<string, unknown>, key: string, value: unknown) {
      if (FIELDS.includes(key)) {
        return `!${String(value)}!`;
      } else if (key === 'value' && this.type === 'integer') {
        return `!${String(value)}!`;
      } else {
        return value;
      }
    },
    0,
  ).replace(/"!(-?\d+)!"/g, '$1');
}
