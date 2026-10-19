import { describe, expect, it } from 'vitest';
import {
  clearSessionCookie,
  getTokenFromRequest,
  isTreasuryUser,
  makeSessionCookie,
  revokeToken,
  signToken,
  verifyToken,
} from '../src/lib/auth';

describe('auth', () => {
  describe('signToken / verifyToken', () => {
    it('signs and verifies a token for a valid username', async () => {
      const token = await signToken('jourlez');
      const payload = await verifyToken(token);
      expect(payload?.username).toBe('jourlez');
    });

    it('returns null for a tampered token', async () => {
      const token = await signToken('jourlez');
      const tampered = `${token}garbage`;
      expect(await verifyToken(tampered)).toBeNull();
    });

    it('returns null for a garbage string', async () => {
      expect(await verifyToken('not.a.token')).toBeNull();
    });
  });

  describe('makeSessionCookie / getTokenFromRequest', () => {
    it('round-trips the token through a cookie header', async () => {
      const token = await signToken('testuser');
      const cookieHeader = makeSessionCookie(token);

      const request = new Request('https://example.com/', {
        headers: { cookie: cookieHeader.split(';')[0]! },
      });

      expect(getTokenFromRequest(request)).toBe(token);
    });

    it('returns null when the cookie is absent', () => {
      const request = new Request('https://example.com/');
      expect(getTokenFromRequest(request)).toBeNull();
    });

    it('returns null when cookie has a different name', () => {
      const request = new Request('https://example.com/', {
        headers: { cookie: 'other_cookie=abc123' },
      });
      expect(getTokenFromRequest(request)).toBeNull();
    });
  });

  describe('clearSessionCookie', () => {
    it('sets Max-Age=0', () => {
      expect(clearSessionCookie()).toContain('Max-Age=0');
    });
  });
});

describe('session revocation', () => {
  it('rejects a token after logout revokes it', async () => {
    const token = await signToken('revoke-me');
    expect(await verifyToken(token)).toEqual({ username: 'revoke-me' });
    await revokeToken(token);
    expect(await verifyToken(token)).toBeNull();
  });

  it('leaves other sessions of the same user valid', async () => {
    const a = await signToken('two-tabs');
    const b = await signToken('two-tabs');
    await revokeToken(a);
    expect(await verifyToken(b)).toEqual({ username: 'two-tabs' });
  });

  it('issues sessions that expire within two hours', async () => {
    const [, payload] = (await signToken('ttl')).split('.');
    const { exp, iat } = JSON.parse(Buffer.from(payload ?? '', 'base64url').toString()) as {
      exp: number;
      iat: number;
    };
    expect(exp - iat).toBe(2 * 3600);
  });
});

describe('isTreasuryUser', () => {
  it('allows only listed GitHub logins, case-insensitively', () => {
    const env = { ADMIN_DASHBOARD_TREASURY_USERS: 'Alice, bob', NODE_ENV: 'production' };
    expect(isTreasuryUser('alice', env)).toBe(true);
    expect(isTreasuryUser('BOB', env)).toBe(true);
    expect(isTreasuryUser('mallory', env)).toBe(false);
  });

  it('denies everyone in production when no list is configured', () => {
    expect(isTreasuryUser('alice', { NODE_ENV: 'production' })).toBe(false);
  });

  it('allows everyone outside production when no list is configured', () => {
    expect(isTreasuryUser('alice', { NODE_ENV: 'development' })).toBe(true);
  });
});
