import { isValidAssetId } from './url';

export interface LogoSubmission {
  assetId: string;
  name: string;
  symbol: string;
  issuer: string;
}

/**
 * The protocol's own bound on an issued asset's name (4-16 UTF-8 bytes; see
 * `packages/sdk/transactions/src/validators/validators.ts` and the mirrored form
 * validation in `apps/exchange/src/lib/forms.ts`). The real caller is already
 * constrained to this, but the builder enforces it again itself — a guarantee
 * that only holds because of a bound enforced three layers away, in a
 * different package, stops holding the moment a second caller exists.
 */
const NAME_MAX_CHARS = 16;

/**
 * The protocol has no bound on a display symbol/ticker at all. Real-world
 * ticker symbols are conventionally well under 10 characters, so this is a
 * generous cap that still keeps the query string small regardless of what a
 * future caller passes in.
 */
const SYMBOL_MAX_CHARS = 20;

/**
 * The practical safe ceiling for a URL a browser and GitHub will both accept
 * unmangled. Fields we don't truncate (e.g. `issuer`) can still blow past
 * this, so it's enforced again on the finished string as a last resort.
 */
const URL_LENGTH_CEILING = 2000;

function truncate(value: string, maxChars: number): string {
  return value.length > maxChars ? value.slice(0, maxChars) : value;
}

/**
 * Opens a GitHub issue with every field the intake Action needs, pre-filled.
 *
 * An issue rather than a pull request because a PR URL cannot carry the image:
 * `value` fills a text box, the safe URL ceiling is about 2,000 characters, and
 * a 256x256 PNG is roughly 13,600 base64 characters. Issue bodies accept
 * drag-and-drop image upload natively and host the result, so the one manual
 * step is dropping in a file the browser has already downloaded.
 */
export function logoIssueUrl(repo: string, submission: LogoSubmission): string | null {
  const { assetId, issuer } = submission;
  if (!isValidAssetId(assetId)) return null;

  const name = truncate(submission.name, NAME_MAX_CHARS);
  const symbol = truncate(submission.symbol, SYMBOL_MAX_CHARS);

  const body = [
    `**Asset ID:** \`${assetId}\``,
    `**Name:** ${name}`,
    `**Symbol:** ${symbol}`,
    `**Issuer:** \`${issuer}\``,
    '',
    '---',
    '',
    '### Attach the logo',
    '',
    'Drag the `logo.png` this page downloaded into the box below, then submit.',
    '',
    '- [ ] 256x256, square, under 100 KB',
    '- [ ] Transparent background, no text or watermark',
    '- [ ] I have the right to publish this image',
  ].join('\n');

  const params = new URLSearchParams({
    body,
    labels: 'logo-submission',
    title: `Add logo: ${name} (${symbol})`,
  });

  const url = `https://github.com/${repo}/issues/new?${params.toString()}`;
  return url.length < URL_LENGTH_CEILING ? url : null;
}
