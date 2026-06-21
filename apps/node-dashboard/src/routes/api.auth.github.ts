import { type LoaderFunctionArgs, redirect } from 'react-router';

export function loader(_: LoaderFunctionArgs) {
  const appUrl = process.env.APP_URL ?? 'http://localhost:5173';
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID ?? '',
    redirect_uri: `${appUrl}/api/auth/github/callback`,
    scope: 'read:org',
  });
  return redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
}
