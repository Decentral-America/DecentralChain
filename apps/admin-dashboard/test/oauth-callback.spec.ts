import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../src/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));

import { verifyToken } from '../src/lib/auth';
import { loader } from '../src/routes/api.auth.github.callback';

type Reply = { status?: number; body?: unknown };

function stubGitHub(replies: { token: Reply; user: Reply; member: Reply }) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = String(input);
      const reply = url.includes('/login/oauth/access_token')
        ? replies.token
        : url.includes('/members/')
          ? replies.member
          : replies.user;
      return reply.body === undefined
        ? new Response(null, { status: reply.status ?? 200 })
        : Response.json(reply.body, { status: reply.status ?? 200 });
    }),
  );
}

const callback = (query: string, stateCookie?: string) =>
  loader({
    context: {},
    params: {},
    request: new Request(`https://admin.test/api/auth/github/callback?${query}`, {
      headers: stateCookie ? { cookie: `oauth_state=${stateCookie}` } : {},
    }),
  } as never) as Promise<Response>;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/auth/github/callback', () => {
  it('rejects a callback whose state does not match the cookie (CSRF)', async () => {
    stubGitHub({
      member: { status: 204 },
      token: { body: { access_token: 't' } },
      user: { body: { login: 'x' } },
    });
    const response = await callback('code=c&state=attacker', 'real-state');
    expect(response.status).toBe(302);
    expect(response.headers.get('Location')).toBe('/login?error=oauth_state_mismatch');
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('refuses a GitHub user who is not an org member, without a session', async () => {
    stubGitHub({
      member: { status: 404 },
      token: { body: { access_token: 't' } },
      user: { body: { login: 'mallory' } },
    });
    const response = await callback('code=c&state=s1', 's1');
    expect(response.headers.get('Location')).toBe('/login?error=not_a_member');
    expect(response.headers.getSetCookie().some((c) => c.startsWith('admin_token=ey'))).toBe(false);
  });

  it('reports a failed code exchange', async () => {
    stubGitHub({
      member: { status: 204 },
      token: { body: { error: 'bad_verification_code' } },
      user: { body: {} },
    });
    const response = await callback('code=c&state=s2', 's2');
    expect(response.headers.get('Location')).toBe('/login?error=token_exchange_failed');
  });

  it('issues a session for an org member and clears the state cookie', async () => {
    stubGitHub({
      member: { status: 204 },
      token: { body: { access_token: 't' } },
      user: { body: { login: 'alice' } },
    });
    const response = await callback('code=c&state=s3', 's3');
    expect(response.headers.get('Location')).toBe('/');
    const cookies = response.headers.getSetCookie();
    const session =
      cookies
        .find((c) => c.startsWith('admin_token='))
        ?.split(';')[0]
        ?.split('=')[1] ?? '';
    expect(await verifyToken(session)).toEqual({ username: 'alice' });
    expect(cookies.some((c) => c.startsWith('oauth_state=;'))).toBe(true);
  });
});
