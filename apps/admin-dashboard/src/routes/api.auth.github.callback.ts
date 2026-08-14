import { type LoaderFunctionArgs, redirect } from 'react-router';
import { clearStateCookie, getStateFromRequest, makeSessionCookie, signToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const returnedState = url.searchParams.get('state');
  const expectedState = getStateFromRequest(request);

  if (!returnedState || !expectedState || returnedState !== expectedState) {
    logger.warn('GitHub OAuth callback: state mismatch or missing — possible CSRF attempt');
    return redirect('/login?error=oauth_state_mismatch', {
      headers: { 'Set-Cookie': clearStateCookie() },
    });
  }

  if (error || !code) {
    logger.warn({ error }, 'GitHub OAuth denied or missing code');
    return redirect('/login?error=oauth_denied', {
      headers: { 'Set-Cookie': clearStateCookie() },
    });
  }

  const appUrl = process.env.ADMIN_DASHBOARD_URL ?? 'http://localhost:5173';

  // Exchange code for access token
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    body: JSON.stringify({
      client_id: process.env.ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_SECRET,
      code,
      redirect_uri: `${appUrl}/api/auth/github/callback`,
    }),
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal: AbortSignal.timeout(10_000),
  });

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };

  if (!tokenData.access_token) {
    logger.error({ error: tokenData.error }, 'GitHub token exchange failed');
    return redirect('/login?error=token_exchange_failed');
  }

  const accessToken = tokenData.access_token;

  // Get GitHub user info
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(10_000),
  });

  const user = (await userRes.json()) as { login?: string };

  if (!user.login) {
    logger.error('GitHub user info missing login field');
    return redirect('/login?error=user_fetch_failed');
  }

  // Verify org membership
  const org = process.env.ADMIN_DASHBOARD_GITHUB_ORG ?? 'Decentral-America';
  const memberRes = await fetch(`https://api.github.com/orgs/${org}/members/${user.login}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (memberRes.status !== 204) {
    logger.warn(
      { org, status: memberRes.status, username: user.login },
      'GitHub org membership check failed',
    );
    return redirect('/login?error=not_a_member');
  }

  logger.info({ username: user.login }, 'Admin login successful');

  const token = await signToken(user.login);
  const headers = new Headers();
  headers.append('Set-Cookie', makeSessionCookie(token));
  headers.append('Set-Cookie', clearStateCookie());
  return redirect('/', { headers });
}
