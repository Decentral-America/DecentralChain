import { type ComponentType, lazy } from 'react';

/**
 * A route screen loaded on demand.
 *
 * Every screen that was statically imported here landed in one 3.5 MB entry
 * chunk — a visitor downloading the landing page also downloaded the DEX, the
 * charting library and the token wizard. `React.lazy` moves each screen into
 * its own chunk, fetched the first time its route is matched.
 *
 * This wrapper exists because the pages use named exports, which `React.lazy`
 * does not take directly. The critical entry screens — the landing page and
 * both auth screens — stay static: they are the first paint, and a spinner
 * before a marketing page is worse than the bytes.
 */
export function lazyPage<T extends object, K extends keyof T>(
  importer: () => Promise<T>,
  name: K,
): ComponentType {
  return lazy(() => importer().then((module) => ({ default: module[name] as ComponentType })));
}
