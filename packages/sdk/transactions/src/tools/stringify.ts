/**
 * Serialize a matcher order or cancel-order object to JSON, converting numeric
 * blockchain amount fields to bare numbers (not quoted strings) even when the
 * value is expressed as a BigInt or Long in the source object.
 *
 * Background: the matcher API expects amount fields as JSON numbers, but
 * Long/BigNumber values would normally serialize to strings.  The replacer
 * converts them to a temporary sentinel form `!<digits>!`, and the trailing
 * `.replace()` strips the surrounding quotes so they land as bare numbers.
 */

const NUMERIC_FIELDS: ReadonlySet<string> = new Set([
  'amount',
  'matcherFee',
  'price',
  'fee',
  'minSponsoredAssetFee',
  'quantity',
  'sellMatcherFee',
  'buyMatcherFee',
]);

export function stringifyOrder<T extends object>(data: T): string {
  return JSON.stringify(
    data,
    function (this: { type?: string; [key: string]: unknown }, key: string, value: unknown) {
      if (NUMERIC_FIELDS.has(key)) {
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
