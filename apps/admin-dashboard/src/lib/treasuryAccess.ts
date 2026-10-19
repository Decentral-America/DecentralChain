import { getTokenFromRequest, isTreasuryUser, verifyToken } from '@/lib/auth';

export type TreasuryAccess = { ok: true; user: string } | { ok: false; response: Response };

/** 401 without a valid session, 403 for a valid session without the treasury role. */
export async function requireTreasuryUser(request: Request): Promise<TreasuryAccess> {
  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;
  if (!session) return { ok: false, response: new Response('Unauthorized', { status: 401 }) };
  if (!isTreasuryUser(session.username)) {
    return {
      ok: false,
      response: Response.json(
        { error: 'Treasury actions are limited to ADMIN_DASHBOARD_TREASURY_USERS' },
        { status: 403 },
      ),
    };
  }
  return { ok: true, user: session.username };
}
