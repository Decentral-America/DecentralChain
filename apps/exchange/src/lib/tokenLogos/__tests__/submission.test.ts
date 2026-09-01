import { describe, expect, it } from 'vitest';
import { logoIssueUrl } from '../submission';

const REPO = 'Decentral-America/token-logos';
const SUB = {
  assetId: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  issuer: '3PQ6wCS3zAkDEJtvGntQZbjuLw24kxTqndr',
  name: 'Wizard Coin',
  symbol: 'WIZ',
};

describe('logoIssueUrl', () => {
  it('targets the logo repository issue form', () => {
    expect(logoIssueUrl(REPO, SUB)).toContain(
      'https://github.com/Decentral-America/token-logos/issues/new',
    );
  });

  it('carries every field the intake action needs to open the pull request', () => {
    const body = new URL(logoIssueUrl(REPO, SUB) as string).searchParams.get('body') ?? '';
    expect(body).toContain(SUB.assetId);
    expect(body).toContain(SUB.name);
    expect(body).toContain(SUB.symbol);
    expect(body).toContain(SUB.issuer);
  });

  it('labels the issue so the intake action can find it', () => {
    const url = new URL(logoIssueUrl(REPO, SUB) as string);
    expect(url.searchParams.get('labels')).toBe('logo-submission');
  });

  it('encodes a name containing characters that would break the query string', () => {
    const url = logoIssueUrl(REPO, { ...SUB, name: 'A&B #1 = "best"' }) as string;
    expect(() => new URL(url)).not.toThrow();
    expect(new URL(url).searchParams.get('title')).toContain('A&B #1 = "best"');
  });

  it('stays inside the practical url ceiling', () => {
    expect((logoIssueUrl(REPO, SUB) as string).length).toBeLessThan(2000);
  });

  it('returns null for an invalid asset id', () => {
    expect(logoIssueUrl(REPO, { ...SUB, assetId: '../../evil' })).toBeNull();
  });
});
