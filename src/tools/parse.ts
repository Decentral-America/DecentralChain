/**
 * Matches JSON numeric values with 14+ digits (before or after the decimal point)
 * that risk IEEE-754 precision loss, and wraps them in quotes so they survive
 * JSON.parse as strings rather than being silently truncated.
 *
 * Two patterns are applied:
 *
 * 1. Keyed values — `"key": 12345678901234567`
 *    Pattern: ("\w+"):\s*(-?\d{14,}(?:\.\d+)?|-?\d+\.\d{14,})
 *
 * 2. Bare values in arrays / top-level — `[12345678901234567]` or `[1, 12345678901234567]`
 *    Pattern: (?<=[[,])\s*(-?\d{14,}(?:\.\d+)?|-?\d+\.\d{14,})
 *    Uses a lookbehind for `[` or `,` so it only matches array elements.
 */
const keyedReg = /("\w+"):\s*(-?\d{14,}(?:\.\d+)?|-?\d+\.\d{14,})(?=\s*[,}\]])/g;
const bareReg = /(?<=[[,])\s*(-?\d{14,}(?:\.\d+)?|-?\d+\.\d{14,})(?=\s*[,\]])/g;

export default function (json: string): unknown {
  return JSON.parse(
    json.replace(keyedReg, '$1:"$2"').replace(bareReg, (match, num: string) => match.replace(num, `"${num}"`)),
  ) as unknown;
}
