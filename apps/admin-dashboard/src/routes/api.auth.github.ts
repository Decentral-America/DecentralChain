import { type LoaderFunctionArgs, redirect } from 'react-router';

export function loader(_: LoaderFunctionArgs) {
  const appUrl = process.env.ADMIN_DASHBOARD_URL ?? 'http://localhost:5173';
  const params = new URLSearchParams({
    client_id: process.env.ADMIN_DASHBOARD_GITHUB_OAUTH_CLIENT_ID ?? '',
    redirect_uri: `${appUrl}/api/auth/github/callback`,
    scope: 'read:org',
  });
  return redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
