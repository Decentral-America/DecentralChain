import {
  BrowserClient,
  defaultStackParser,
  getDefaultIntegrations,
  makeFetchTransport,
  Scope,
} from '@sentry/browser';

// Module-level scope. Null until initSentry() is called.
// Shared across all captureException() calls within this extension entry point.
let _scope: Scope | null = null;

/**
 * Initialise Sentry for a browser extension entry point using the isolated
 * BrowserClient + Scope pattern.
 *
 * DO NOT use Sentry.init() in browser extensions — it writes to the global
 * Sentry hub and can leak events to (or receive events from) any Sentry
 * instance running on the host page.
 *
 * See: https://docs.sentry.io/platforms/javascript/best-practices/shared-environments/
 */
export function initSentry({
  shouldIgnoreError,
  source,
}: {
  shouldIgnoreError: (message: string) => Promise<boolean>;
  source: 'background' | 'popup' | 'accounts';
}): void {
  if (!__SENTRY_DSN__) return;

  // Filter out integrations that access or mutate global state.
  // Required for shared environments (browser extensions, VS Code extensions, widgets).
  const integrations = getDefaultIntegrations({}).filter(
    (i) =>
      ![
        'BrowserApiErrors',
        'BrowserSession',
        'Breadcrumbs',
        'ConversationId',
        'GlobalHandlers',
        'FunctionToString',
      ].includes(i.name),
  );

  const client = new BrowserClient({
    beforeSend: async (event, hint) => {
      const message =
        hint?.originalException &&
        typeof hint.originalException === 'object' &&
        'message' in hint.originalException &&
        typeof hint.originalException.message === 'string' &&
        hint.originalException.message
          ? hint.originalException.message
          : String(hint?.originalException);

      if (await shouldIgnoreError(message)) {
        return null;
      }

      return event;
    },
    dsn: __SENTRY_DSN__,
    environment: __SENTRY_ENVIRONMENT__,
    integrations,
    release: __SENTRY_RELEASE__,
    stackParser: defaultStackParser,
    transport: makeFetchTransport,
  });

  const scope = new Scope();
  scope.setClient(client);
  client.init(); // Must be called after scope.setClient()
  scope.setTag('source', source);
  _scope = scope;
}

/**
 * Capture an exception using the extension's isolated Sentry scope.
 *
 * Drop-in replacement for the global captureException() from @sentry/browser.
 * Silently no-ops when initSentry() has not been called or returned early
 * (e.g. no DSN configured).
 */
export function captureException(...args: Parameters<Scope['captureException']>): void {
  _scope?.captureException(...args);
}
