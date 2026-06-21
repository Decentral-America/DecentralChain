import './app.css';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { getAuthenticatedUser } from '@/lib/access';
import { logger } from '@/lib/logger';
import { queryClientInstance } from '@/lib/query-client';
import { type Route } from './+types/root';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const cfTeamDomain = process.env.CF_TEAM_DOMAIN ?? '';
  const logoutUrl = cfTeamDomain
    ? `https://${cfTeamDomain}/cdn-cgi/access/logout?returnTo=${encodeURIComponent(`${url.protocol}//${url.host}`)}`
    : '/';

  logger.debug({ path: url.pathname, user }, 'request');

  return {
    cfTeamDomain,
    logoutUrl,
    nodeUrl: process.env.DCC_NODE_URL ?? 'https://testnet-node.decentralchain.io',
    scannerUrl: process.env.SCANNER_URL ?? 'https://testnet-scanner.decentralchain.io',
    user,
  };
}

export const links: Route.LinksFunction = () => [{ href: '/favicon.ico', rel: 'icon' }];

export function meta(): Route.MetaDescriptors {
  return [{ title: 'DCC Node Dashboard' }];
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <QueryClientProvider client={queryClientInstance}>
            {children}
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error) && error.status === 401) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h1 className="text-4xl font-bold mb-4">Access Denied</h1>
        <p className="text-muted-foreground">
          This dashboard is protected by Cloudflare Access. Authenticate through your organization.
        </p>
      </main>
    );
  }

  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">{message}</h1>
      <p className="text-muted-foreground mb-6">{details}</p>
      {stack && (
        <pre className="text-left text-sm bg-muted p-4 rounded-md overflow-auto max-w-2xl w-full">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
