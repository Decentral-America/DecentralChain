import { createElement, Suspense, use } from 'react';
import {
  createRequestHandler,
  Outlet,
  Scripts,
  ScrollRestoration,
  type ServerBuild,
} from 'react-router';
import { describe, expect, it, vi } from 'vitest';

// entry.server runs a schema migration at import time; keep the test off Postgres.
vi.mock('@/lib/db', () => ({ migrateSchema: vi.fn(async () => {}) }));
// root.tsx pulls generated route types; the handler only needs runtimeConfig() from it.
vi.mock('../src/root', () => ({
  runtimeConfig: () => ({ grafanaUrl: '', nodeUrl: 'https://node.example', scannerUrl: '' }),
}));

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// A component that suspends past the shell so React streams a boundary-completion
// inline <script> for a browser (non-bot) request, which is rendered on shell-ready.
const late = new Promise<string>((resolve) => setTimeout(() => resolve('streamed'), 20));
function Late() {
  return createElement('p', null, use(late));
}

function Layout({ children }: { children: React.ReactNode }) {
  return createElement(
    'html',
    { lang: 'en' },
    createElement('head', null),
    createElement('body', null, children, createElement(ScrollRestoration), createElement(Scripts)),
  );
}

function Root() {
  return createElement(
    'main',
    null,
    createElement(Suspense, { fallback: createElement('p', null, 'loading') }, createElement(Late)),
    createElement(Outlet),
  );
}

async function buildFor(): Promise<ServerBuild> {
  const entry = await import('../src/entry.server');
  return {
    assets: {
      entry: { imports: [], module: '/assets/entry.client.js' },
      routes: {
        root: {
          hasAction: false,
          hasClientAction: false,
          hasClientLoader: false,
          hasClientMiddleware: false,
          hasErrorBoundary: false,
          hasLoader: false,
          id: 'root',
          imports: [],
          module: '/assets/root.js',
          path: '',
        },
      },
      url: '/assets/manifest.js',
      version: 'test',
    },
    assetsBuildDirectory: 'build/client',
    entry: { module: entry },
    future: {},
    isSpaMode: false,
    prerender: [],
    publicPath: '/',
    routeDiscovery: { manifestPath: '/__manifest', mode: 'lazy' },
    routes: {
      root: {
        caseSensitive: undefined,
        id: 'root',
        index: undefined,
        module: { default: Root, Layout },
        parentId: undefined,
        path: '',
      },
    },
    ssr: true,
  } as unknown as ServerBuild;
}

describe('entry.server CSP nonce', () => {
  it('puts the response-header nonce on every inline script in the streamed HTML', async () => {
    const handler = createRequestHandler(await buildFor(), 'production');
    const res = await handler(
      new Request('http://localhost/', { headers: { 'user-agent': BROWSER_UA } }),
    );
    const html = await res.text();

    const csp = res.headers.get('Content-Security-Policy') ?? '';
    const nonce = /'nonce-([^']+)'/.exec(csp)?.[1];
    expect(nonce, 'CSP header carries a script nonce').toBeTruthy();

    // Inline = no src attribute. Module/importmap scripts count too.
    const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map((m) => m[1] ?? '');
    const inline = scripts.filter((attrs) => !/\ssrc=/.test(attrs));
    // Sanity: React Router bootstrap + React's streamed boundary script are present.
    expect(html).toContain('streamed');
    expect(inline.length).toBeGreaterThan(2);
    for (const attrs of inline) {
      expect(attrs, `inline <script${attrs}> must carry the CSP nonce`).toContain(
        `nonce="${nonce}"`,
      );
    }
  });
});
