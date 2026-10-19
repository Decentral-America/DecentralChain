import { describe, expect, it } from 'vitest';
import { signToken, verifyToken } from '../src/lib/auth';
import { action } from '../src/routes/api.auth.logout';

describe('POST /api/auth/logout', () => {
  it('clears the cookie and revokes the session server-side', async () => {
    const token = await signToken('leaver');
    const response = (await action({
      context: {},
      params: {},
      request: new Request('https://admin.test/api/auth/logout', {
        headers: { cookie: `admin_token=${token}` },
        method: 'POST',
      }),
    } as never)) as Response;
    expect(response.headers.get('Location')).toBe('/login');
    expect(response.headers.getSetCookie().some((c) => c.startsWith('admin_token=;'))).toBe(true);
    expect(await verifyToken(token)).toBeNull();
  });
});
