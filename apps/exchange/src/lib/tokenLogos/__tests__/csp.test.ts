/**
 * The manifest fetch is only possible if the CSP allows it.
 *
 * `fetch()` is governed by `connect-src`, not `img-src`. The logo work shipped
 * relying on `img-src 'self' data: https:` — which does allow the <img> that
 * renders a tail logo, but says nothing about the XHR that fetches
 * `manifest.json`. With the CDN missing from `connect-src` the browser refuses
 * the request, `loadManifest`'s catch turns that into `EMPTY_MANIFEST` with an
 * empty `sha`, and `logoUrlFor` then returns `null` for every asset. One
 * blocked request kills both the hot set and the tail.
 *
 * Asserted as a test because the CSP lives in deployment config that no other
 * part of the gate reads: tsc, biome and vitest would all stay green while the
 * feature was dead in a browser.
 *
 * Every CSP that ships this app is checked, including the nested `.html$`
 * location blocks — nginx's `add_header` does NOT inherit into a location that
 * declares its own, so those repeated blocks are the policy that actually
 * reaches `index.html`, and therefore the SPA.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const APP_ROOT = path.resolve(import.meta.dirname, '../../../..');

const LOGO_CDN = 'https://cdn.jsdelivr.net';

/** Every file in this app that declares a Content-Security-Policy. */
const CSP_FILES = ['vite.config.ts', 'nginx.conf', 'docker/nginx/default.conf'];

/**
 * A `connect-src` directive runs until the next `;` (nginx, where directives
 * are semicolon-separated inside one header string) or the next `"` (the vite
 * dev-server config, where each directive is its own quoted array element).
 */
const CONNECT_SRC = /connect-src[^;"]*/g;

const directivesIn = (file: string): string[] => {
  const source = readFileSync(path.join(APP_ROOT, file), 'utf8');
  return [...source.matchAll(CONNECT_SRC)].map((match) => match[0]);
};

describe('Content-Security-Policy', () => {
  const found = CSP_FILES.flatMap((file) =>
    directivesIn(file).map((directive) => ({ directive, file })),
  );

  /**
   * Guards the guard. If a config file is renamed or a directive stops being
   * matchable, `found` silently empties and every assertion below passes
   * vacuously. Five is the count at the time of writing: one dev-server policy,
   * two in `nginx.conf` (server + `.html$`), two in `docker/nginx/default.conf`
   * (server + `.html$`).
   */
  it('finds every shipped connect-src directive', () => {
    expect(found.length).toBeGreaterThanOrEqual(5);
  });

  it.each(CSP_FILES)('%s declares at least one connect-src', (file) => {
    expect(directivesIn(file).length).toBeGreaterThan(0);
  });

  it('allows the logo CDN in every connect-src that ships', () => {
    const missing = found.filter(({ directive }) => !directive.includes(LOGO_CDN));
    expect(missing.map(({ file }) => file)).toEqual([]);
  });
});
