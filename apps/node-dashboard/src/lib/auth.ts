import { jwtVerify, SignJWT } from 'jose';

const SESSION_COOKIE = 'admin_token';
const SESSION_DURATION = '8h';
const SESSION_DURATION_SECONDS = 8 * 3600;
const DEFAULT_JWT_SECRET = 'dev-secret-change-me';

export function isUsingDefaultSecret(): boolean {
  const s = process.env.NODE_DASHBOARD_JWT_SECRET;
  return !s || s === DEFAULT_JWT_SECRET;
}

export function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.NODE_DASHBOARD_JWT_SECRET ?? DEFAULT_JWT_SECRET);
}

export async function signToken(username: string): Promise<string> {
  return new SignJWT({ role: 'admin', username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(SESSION_DURATION)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<{ username: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { username: payload.username as string };
  } catch {
    return null;
  }
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
