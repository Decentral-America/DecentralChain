import { createRemoteJWKSet, jwtVerify } from 'jose';
import { logger } from './logger';

// jose caches JWKS and handles key rotation automatically — one instance per process.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> {
  if (!jwks) {
    const domain = process.env.CF_TEAM_DOMAIN;
    if (!domain) throw new Error('CF_TEAM_DOMAIN is not configured');
    jwks = createRemoteJWKSet(new URL(`https://${domain}/cdn-cgi/access/certs`));
  }
  return jwks;
}

/**
 * Returns the authenticated user's email from the Cloudflare Access JWT.
 *
 * In production: verifies the signed `Cf-Access-Jwt-Assertion` header against
 * Cloudflare's published public keys. Defense-in-depth — CF Access already
 * blocks unauthenticated requests at the network edge before they reach the
 * server, but we verify the JWT anyway to prevent header spoofing if the
 * origin is ever directly reachable.
 *
 * In development: returns DEV_USER_EMAIL (no Cloudflare proxy in local dev).
 */
export async function getAuthenticatedUser(request: Request): Promise<string | null> {
  if (process.env.NODE_ENV !== 'production') {
    return process.env.DEV_USER_EMAIL ?? 'dev@local';
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      audience: process.env.CF_ACCESS_AUD,
      issuer: `https://${process.env.CF_TEAM_DOMAIN}`,
    });
    return (payload.email as string | undefined) ?? null;
  } catch (err) {
    logger.warn({ err }, 'CF Access JWT verification failed');
    return null;
  }
}
