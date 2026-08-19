/**
 * Raw-colour lint.
 *
 * Enforced as a test rather than a bespoke lint rule so it runs in the gate the
 * repo already has. This is the guard that stops the app drifting back into
 * three competing colour systems: the previous state existed precisely because
 * nothing stopped a component inventing its own hex.
 *
 * Walks the tree with `node:fs` rather than `fast-glob`: the package is not
 * actually present in this workspace's lockfile (confirmed via
 * `node -e "require.resolve('fast-glob')"`, which throws MODULE_NOT_FOUND),
 * so this uses the brief's documented fallback instead of adding a dependency.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = path.resolve(import.meta.dirname, '../..');

/**
 * Files allowed to name a literal colour, each with a stated reason — this
 * list is a decision on the record, not a way to make the test pass. See
 * task-8-report.md for the full disposition of every offender the first run
 * of this test found.
 */
const ALLOWED = [
  // Token-definition files. Their whole purpose is to be the one place a
  // literal colour lives so every consumer can read a name instead.
  'theme/tokens/semantic.ts',
  'theme/surfaces.ts',
  'styles/tokens.ts',
  'theme/landingTheme.ts',
  // Mobile's sibling to `styles/tokens.ts` — same role (the one place the
  // mobile visual system's literals live), explicit in its own header:
  // "Declared here so the app bar has no raw colour literals of its own."
  'styles/mobileTokens.ts',
  // Third-party brand identity colours (Bitcoin/Ethereum/Solana/BNB, paired
  // with their real brand icons from the `cryptocurrency-icons` package) and
  // one pre-existing per-asset accent — genuinely not this app's theme, the
  // brief's own "third-party embed's required value" case. See
  // `brandMarks.ts`'s own header.
  'styles/brandMarks.ts',
  // Dev-only: lazy-loaded behind `import.meta.env.DEV` in App.tsx and
  // dead-code-eliminated from the production bundle entirely. It never
  // reaches an end user, so it carries none of the app's design-system
  // obligations — the same reasoning that exempts a devtools panel.
  'components/PerformanceDashboard.tsx',
  // Explicitly theme-independent by construction (see its own in-file
  // comment): "Inline styles to avoid theme dependency (ErrorBoundary must
  // work before ThemeProvider)". It is the fallback for when the app,
  // including its theme, has already failed to render — it cannot depend on
  // the thing that may be broken.
  'components/ErrorBoundary.tsx',
];

const HEX = /#[0-9a-fA-F]{3,8}\b/;
const RGBA = /\brgba?\(/;

const IGNORED_DIRS = new Set(['__tests__', 'node_modules']);

/**
 * `*.stories.tsx` is excluded the same way `tsconfig.app.json` already
 * excludes it from the type-check gate (`"exclude": ["src/**\/*.stories.tsx",
 * ...]`) — Storybook itself isn't installed in this workspace (no
 * `@storybook/*` dependency, no config), so these files render nowhere and
 * carry no design-system obligation either. Matching an existing, already-
 * reasoned exclusion rather than inventing a new one.
 */
function isStoryFile(name: string): boolean {
  return /\.stories\.tsx?$/.test(name);
}

function listFiles(dir: string, base = ''): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) continue;
      files = files.concat(listFiles(path.join(dir, entry.name), rel));
    } else if (
      /\.(ts|tsx)$/.test(entry.name) &&
      !entry.name.endsWith('.d.ts') &&
      !isStoryFile(entry.name)
    ) {
      files.push(rel);
    }
  }
  return files;
}

describe('no raw colour literals in components', () => {
  it('every colour comes from a token', () => {
    // Sanity check on the walker itself, not just a nicety: if this silently
    // resolved to the wrong root the whole test would pass vacuously.
    expect(statSync(SRC).isDirectory()).toBe(true);

    const files = listFiles(SRC).filter((rel) => !ALLOWED.includes(rel));

    const offenders: string[] = [];
    for (const rel of files) {
      const src = readFileSync(path.join(SRC, rel), 'utf8');
      src.split('\n').forEach((line, i) => {
        if (line.trimStart().startsWith('*') || line.trimStart().startsWith('//')) return;
        if (HEX.test(line) || RGBA.test(line)) offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
      });
    }

    expect(offenders, `Use a semantic token instead:\n${offenders.join('\n')}`).toEqual([]);
  });
});
