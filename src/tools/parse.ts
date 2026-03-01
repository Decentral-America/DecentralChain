/**
 * Matches JSON numeric values with 14+ digits (before or after the decimal point)
 * that risk IEEE-754 precision loss, and wraps them in quotes so they survive
 * JSON.parse as strings rather than being silently truncated.
 *
 * Pattern breakdown:
 *   ("\w+"):\s*           — the JSON key in quotes, followed by colon + optional whitespace
 *   (-?\d{14,}(?:\.\d+)?) — large integer (14+ digits) with optional decimal part
 *   (-?\d+\.\d{14,})      — OR a decimal whose fractional part has 14+ digits
 */
const reg = /("\w+"):\s*(-?\d{14,}(?:\.\d+)?|-?\d+\.\d{14,})(?=\s*[,}\]])/g;

export default function (json: string): unknown {
  return JSON.parse(json.replace(reg, '$1:"$2"')) as unknown;
}
