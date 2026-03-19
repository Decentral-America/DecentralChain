import './App.css';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { queryClientInstance } from '@/lib/query-client';
import { type Route } from './+types/root';

export const links: Route.LinksFunction = () => [{ href: '/manifest.json', rel: 'manifest' }];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
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

export function ErrorBoundaryRoute({ error }: Route.ErrorBoundaryProps) {
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
