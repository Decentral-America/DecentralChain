import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
} from 'react-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { logError } from '@/lib/error-logger';
import { queryClientInstance } from '@/lib/query-client';
import { type Route } from './+types/root';

/**
 * Root loader — runs server-side only.
 *
 * Reads runtime Docker env vars and returns them so the Layout
 * can inject window.__DCC_CONFIG__ before client-side scripts load.
 * This allows one Docker image to serve any network at `docker run` time.
 */
export function loader() {
  return {
    dataServiceUrl: process.env.DCC_DATA_SERVICE_URL ?? 'https://data-service.decentralchain.io/v0',
    matcherUrl: process.env.DCC_MATCHER_URL ?? 'https://mainnet-matcher.decentralchain.io',
    nodeUrl: process.env.DCC_NODE_URL ?? 'https://mainnet-node.decentralchain.io',
  };
}

export const links: Route.LinksFunction = () => [
  { href: '/manifest.json', rel: 'manifest' },
  { href: '/favicon.png?v=2', rel: 'icon', type: 'image/png' },
];

/** DCC-158 — Global OG image cards + base meta tags. */
export function meta(): Route.MetaDescriptors {
  return [
    { title: 'DecentralScan — DecentralChain Block Explorer' },
    {
      content:
        'Explore blocks, transactions, addresses, assets, and network health on the DecentralChain (DCC) mainnet in real time.',
      name: 'description',
    },
    { content: 'DecentralScan — DecentralChain Block Explorer', property: 'og:title' },
    {
      content:
        'Real-time blockchain explorer for the DecentralChain (DCC) network. Explore blocks, transactions, addresses, DEX pairs, and network statistics.',
      property: 'og:description',
    },
    { content: 'website', property: 'og:type' },
    { content: '/og-image.png', property: 'og:image' },
    { content: 'summary_large_image', name: 'twitter:card' },
    { content: 'DecentralScan — DecentralChain Block Explorer', name: 'twitter:title' },
    {
      content: 'Real-time blockchain explorer for the DecentralChain (DCC) network.',
      name: 'twitter:description',
    },
    { content: '/og-image.png', name: 'twitter:image' },
  ];
}

export function Layout({ children }: { children: React.ReactNode }) {
  // Read the config injected by the root loader to pass to the client bundle.
  // useRouteLoaderData returns undefined during the static prerender pass — the
  // inline script is simply omitted in that case (no runtime env vars at build time).
  const config = useRouteLoaderData<typeof loader>('root');

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {config && (
          <script
            // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled server data, not user input
            dangerouslySetInnerHTML={{
              // Escape "<" so a future value containing "</script>" can't break out of this
              // script tag context (e.g. via "</script><script>...").
              __html: `window.__DCC_CONFIG__=${JSON.stringify(config).replace(/</g, '\\u003c')};`,
            }}
          />
        )}
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
            <QueryClientProvider client={queryClientInstance}>
              {children}
              <Toaster />
            </QueryClientProvider>
          </ThemeProvider>
        </ErrorBoundary>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

// React Router v7 Framework Mode requires the error boundary to be exported
// under the exact name "ErrorBoundary". The function is named "ErrorBoundaryRoute"
// internally to avoid shadowing the ErrorBoundary class component imported above.
export { ErrorBoundaryRoute as ErrorBoundary };

export function ErrorBoundaryRoute({ error }: Route.ErrorBoundaryProps) {
  useEffect(() => {
    if (error instanceof Error) {
      logError(error, { type: 'route_error' });
    }
  }, [error]);

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
