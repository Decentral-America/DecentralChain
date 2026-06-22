import { describe, expect, it } from 'vitest';
import {
  clearSessionCookie,
  getTokenFromRequest,
  makeSessionCookie,
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
