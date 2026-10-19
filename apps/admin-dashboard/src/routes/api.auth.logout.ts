import { type ActionFunctionArgs, redirect } from 'react-router';
import { clearSessionCookie, getTokenFromRequest, revokeToken } from '@/lib/auth';

export async function action({ request }: ActionFunctionArgs) {
  const token = getTokenFromRequest(request);
  if (token) await revokeToken(token);
  return redirect('/login', {
    headers: { 'Set-Cookie': clearSessionCookie() },
  });
}
