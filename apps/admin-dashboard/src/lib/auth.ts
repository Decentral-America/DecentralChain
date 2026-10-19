import { jwtVerify, SignJWT } from 'jose';

const SESSION_COOKIE = 'admin_token';
const SESSION_DURATION = '2h';
const SESSION_DURATION_SECONDS = 2 * 3600;
const DEFAULT_JWT_SECRET = 'dev-secret-change-me';
const OAUTH_STATE_COOKIE = 'oauth_state';
const OAUTH_STATE_DURATION_SECONDS = 5 * 60;

export function isUsingDefaultSecret(): boolean {
  const s = process.env.ADMIN_DASHBOARD_JWT_SECRET;
  return !s || s === DEFAULT_JWT_SECRET;
}

export function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.ADMIN_DASHBOARD_JWT_SECRET ?? DEFAULT_JWT_SECRET);
}

/**
 * Revoked session ids (jti -> expiry, epoch seconds). In-process: the dashboard
 * runs as a single container, and a restart's loss of this set is bounded by
 * the 2h session lifetime.
 */
const revokedSessions = new Map<string, number>();

export async function signToken(username: string): Promise<string> {
  return new SignJWT({ role: 'admin', username })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (typeof payload.jti === 'string' && revokedSessions.has(payload.jti)) return null;
    if (typeof payload.username !== 'string') return null;
    return { username: payload.username };
  } catch {
    return null;
  }
}

/** Invalidates one session immediately (logout). Invalid or expired tokens are ignored. */
export async function revokeToken(token: string): Promise<void> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ['HS256'] });
    if (typeof payload.jti !== 'string') return;
    const now = Math.floor(Date.now() / 1000);
    for (const [jti, exp] of revokedSessions) if (exp <= now) revokedSessions.delete(jti);
    revokedSessions.set(
      payload.jti,
      typeof payload.exp === 'number' ? payload.exp : now + SESSION_DURATION_SECONDS,
    );
  } catch {
    /* nothing to revoke */
  }
}

type Env = Readonly<Record<string, string | undefined>>;

/**
 * Treasury actions (fund, sweep, scan) move or reveal funds; org membership
 * alone is not enough. Production with no list configured denies everyone.
 */
export function isTreasuryUser(username: string, env: Env = process.env): boolean {
  const allowed = (env.ADMIN_DASHBOARD_TREASURY_USERS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (allowed.length === 0) return env.NODE_ENV !== 'production';
  return allowed.includes(username.toLowerCase());
}

export function generateOAuthState(): string {
  return crypto.randomUUID();
}

export function makeStateCookie(state: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${OAUTH_STATE_COOKIE}=${state}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${OAUTH_STATE_DURATION_SECONDS}${secure}`;
}

export function getStateFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${OAUTH_STATE_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export function clearStateCookie(): string {
  return `${OAUTH_STATE_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

export function getTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  return match?.[1] ?? null;
}

export function makeSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_DURATION_SECONDS}${secure}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}
