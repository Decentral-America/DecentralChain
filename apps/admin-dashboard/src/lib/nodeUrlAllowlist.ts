import { logger } from '@/lib/logger';

type Env = Readonly<Record<string, string | undefined>>;

/**
 * Whether a caller-supplied node URL may be contacted by the server.
 * Matches on origin against ADMIN_DASHBOARD_ALLOWED_NODE_URLS; with no
 * allowlist, production refuses everything.
 */
export function isAllowedNodeUrl(nodeUrl: string, env: Env = process.env): boolean {
  const allowlist = (env.ADMIN_DASHBOARD_ALLOWED_NODE_URLS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (allowlist.length === 0) {
    if (env.NODE_ENV === 'production') return false;
    logger.warn(
      'ADMIN_DASHBOARD_ALLOWED_NODE_URLS is not set — allowing any nodeUrl outside production',
    );
    return true;
  }
  try {
    return allowlist.includes(new URL(nodeUrl).origin);
  } catch {
    return false;
  }
}
