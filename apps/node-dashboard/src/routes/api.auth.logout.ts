import { type ActionFunctionArgs, redirect } from 'react-router';
import { clearSessionCookie } from '@/lib/auth';

export async function action(_: ActionFunctionArgs) {
  return redirect('/login', {
    headers: { 'Set-Cookie': clearSessionCookie() },
  });
}
