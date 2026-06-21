import { type LoaderFunctionArgs } from 'react-router';

// Liveness probe — no auth required. Used by Docker healthcheck and
// container orchestrators to verify the process is responsive.
export function loader(_: LoaderFunctionArgs) {
  return new Response('ok', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
