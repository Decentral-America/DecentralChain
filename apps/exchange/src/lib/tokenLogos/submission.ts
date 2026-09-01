import { isValidAssetId } from './url';

export interface LogoSubmission {
  assetId: string;
  name: string;
  symbol: string;
  issuer: string;
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
  const { assetId, name, symbol, issuer } = submission;
  if (!isValidAssetId(assetId)) return null;

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

  return `https://github.com/${repo}/issues/new?${params.toString()}`;
}
