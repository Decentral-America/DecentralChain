import { type LoaderFunctionArgs } from 'react-router';

export function loader(_: LoaderFunctionArgs) {
  return new Response('User-agent: *\nDisallow: /\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
