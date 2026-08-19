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
 *
 * Fix round 1: the original version matched only `#hex` and `rgb()`/`rgba()`,
 * and treated any line starting with `*` as a comment continuation. Neither
 * caught a *named* CSS colour (`white`, `black`, ...) or the other CSS colour
 * function forms (`hsl()`, `oklch()`, ...), and the `*`-prefix heuristic also
 * silently skipped real code — a CSS universal-selector line (`* { ... }`)
 * inside a styled-components template starts with `*` too, and is not a
 * comment. Both holes let half-converted mode/literal pairs through in this
 * task's own first commit (see task-8-report.md, "Fix round 1"): a hex paired
 * with a literal `white` had its hex half caught and tokenized while the
 * `white` half stayed invisible to the rule, in two cases flipping a working
 * light-mode pairing into an unreadable one once dark mode used the same
 * fixed literal against a token background. Comment detection is now real
 * block-comment state tracking instead of a per-line prefix guess.
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
  // with their real brand icons from the `cryptocurrency-icons` package) —
  // genuinely not this app's theme, the brief's own "third-party embed's
  // required value" case. See `brandMarks.ts`'s own header. (`swapMarkColor`
  // no longer lives here as of Fix round 1 — `dcc` was this app's own asset
  // wearing the third-party exception; it now reads `accent.primary`
  // directly at the call site, and only the pre-existing, test-pinned
  // `usdt` tint remains a genuine per-asset literal, still here.)
  'styles/brandMarks.ts',
  // Dev-only: lazy-loaded behind `import.meta.env.DEV` in App.tsx and
  // dead-code-eliminated from the production bundle entirely. It never
  // reaches an end user, so it carries none of the app's design-system
  // obligations — the same reasoning that exempts a devtools panel.
  // Fix round 1: the reviewer independently confirmed this via a production
  // build — zero occurrences of this file's literals in any emitted `.js`.
  'components/PerformanceDashboard.tsx',
  // Explicitly theme-independent by construction (see its own in-file
  // comment): "Inline styles to avoid theme dependency (ErrorBoundary must
  // work before ThemeProvider)". It is the fallback for when the app,
  // including its theme, has already failed to render — it cannot depend on
  // the thing that may be broken.
  'components/ErrorBoundary.tsx',
];

const HEX = /#[0-9a-fA-F]{3,8}\b/;
/** `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`, `color()`. */
const COLOUR_FN = /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i;

/**
 * CSS Color Module Level 4's named colours (the extended/SVG keyword set),
 * minus `transparent` and `currentcolor` — neither encodes a hue decision,
 * so neither is a "component inventing its own colour" the way the other 147
 * are.
 */
const NAMED_COLOURS = [
  'aliceblue',
  'antiquewhite',
  'aqua',
  'aquamarine',
  'azure',
  'beige',
  'bisque',
  'black',
  'blanchedalmond',
  'blue',
  'blueviolet',
  'brown',
  'burlywood',
  'cadetblue',
  'chartreuse',
  'chocolate',
  'coral',
  'cornflowerblue',
  'cornsilk',
  'crimson',
  'cyan',
  'darkblue',
  'darkcyan',
  'darkgoldenrod',
  'darkgray',
  'darkgreen',
  'darkgrey',
  'darkkhaki',
  'darkmagenta',
  'darkolivegreen',
  'darkorange',
  'darkorchid',
  'darkred',
  'darksalmon',
  'darkseagreen',
  'darkslateblue',
  'darkslategray',
  'darkslategrey',
  'darkturquoise',
  'darkviolet',
  'deeppink',
  'deepskyblue',
  'dimgray',
  'dimgrey',
  'dodgerblue',
  'firebrick',
  'floralwhite',
  'forestgreen',
  'fuchsia',
  'gainsboro',
  'ghostwhite',
  'gold',
  'goldenrod',
  'gray',
  'green',
  'greenyellow',
  'grey',
  'honeydew',
  'hotpink',
  'indianred',
  'indigo',
  'ivory',
  'khaki',
  'lavender',
  'lavenderblush',
  'lawngreen',
  'lemonchiffon',
  'lightblue',
  'lightcoral',
  'lightcyan',
  'lightgoldenrodyellow',
  'lightgray',
  'lightgreen',
  'lightgrey',
  'lightpink',
  'lightsalmon',
  'lightseagreen',
  'lightskyblue',
  'lightslategray',
  'lightslategrey',
  'lightsteelblue',
  'lightyellow',
  'lime',
  'limegreen',
  'linen',
  'magenta',
  'maroon',
  'mediumaquamarine',
  'mediumblue',
  'mediumorchid',
  'mediumpurple',
  'mediumseagreen',
  'mediumslateblue',
  'mediumspringgreen',
  'mediumturquoise',
  'mediumvioletred',
  'midnightblue',
  'mintcream',
  'mistyrose',
  'moccasin',
  'navajowhite',
  'navy',
  'oldlace',
  'olive',
  'olivedrab',
  'orange',
  'orangered',
  'orchid',
  'palegoldenrod',
  'palegreen',
  'paleturquoise',
  'palevioletred',
  'papayawhip',
  'peachpuff',
  'peru',
  'pink',
  'plum',
  'powderblue',
  'purple',
  'rebeccapurple',
  'red',
  'rosybrown',
  'royalblue',
  'saddlebrown',
  'salmon',
  'sandybrown',
  'seagreen',
  'seashell',
  'sienna',
  'silver',
  'skyblue',
  'slateblue',
  'slategray',
  'slategrey',
  'snow',
  'springgreen',
  'steelblue',
  'tan',
  'teal',
  'thistle',
  'tomato',
  'turquoise',
  'violet',
  'wheat',
  'white',
  'whitesmoke',
  'yellow',
  'yellowgreen',
];

/**
 * A named colour used as a *value* — after a CSS/JS `:` (a declaration or
 * object property, quoted or not: `color: white`, `bgcolor: 'white'`), or as
 * a colour-specific JSX/SVG attribute value (`stroke="white"`). Scoped to
 * value position, and the attribute branch to attribute *names* that are
 * actually about colour, rather than "the word appears anywhere on the
 * line" — two real false positives found while extending this rule:
 * `<option value="black">` (an app setting's enum value, not a colour) and
 * MUI's `sx={{ color: 'grey.300' }}` dot-path shorthand (a token reference,
 * the same category `'primary.main'` already is — excluded by the trailing
 * negative lookahead rather than missed by accident).
 */
const COLOUR_ATTR =
  'color|stroke|fill|background(?:Color)?|bgcolor|border(?:Color)?|outline(?:Color)?';
const NAMED_COLOUR = new RegExp(
  `(?::\\s*['"\`]?|\\b(?:${COLOUR_ATTR})\\s*=\\s*['"])` +
    `(?:${NAMED_COLOURS.join('|')})\\b(?!\\.[\\w])`,
  'i',
);

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

/**
 * Real block-comment state, not a per-line prefix guess. The original
 * `line.trimStart().startsWith('*')` treated every such line as a comment
 * continuation — right for a JSDoc body, wrong for a CSS universal-selector
 * rule (`* { margin: 0; }`) inside a styled-components template, which also
 * starts with `*` and is not a comment. Tracking `/* ... *\/` open/close
 * state instead means only lines actually inside a block comment are
 * skipped, whichever character they start with — also recognising `{/*`,
 * the JSX comment opener, which does not start with `/*` itself and was
 * consequently scanned as real code before: two multi-line `{/* ... *\/}`
 * design-rationale comments mentioning "white"/"black" in prose were flagged
 * as offenders while extending this rule, because their opening line's first
 * two characters are `{/` rather than `/*`.
 */
function findOffenders(rel: string, src: string): string[] {
  const offenders: string[] = [];
  let inBlockComment = false;
  src.split('\n').forEach((line, i) => {
    const trimmed = line.trimStart();
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false;
      return;
    }
    if (trimmed.startsWith('//')) return;
    if (trimmed.startsWith('/*') || trimmed.startsWith('{/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true;
      return;
    }
    if (HEX.test(line) || COLOUR_FN.test(line) || NAMED_COLOUR.test(line)) {
      offenders.push(`${rel}:${i + 1}  ${line.trim()}`);
    }
  });
  return offenders;
}

describe('no raw colour literals in components', () => {
  it('every colour comes from a token', () => {
    // Sanity check on the walker itself, not just a nicety: if this silently
    // resolved to the wrong root the whole test would pass vacuously.
    expect(statSync(SRC).isDirectory()).toBe(true);

    const files = listFiles(SRC).filter((rel) => !ALLOWED.includes(rel));

    const offenders = files.flatMap((rel) =>
      findOffenders(rel, readFileSync(path.join(SRC, rel), 'utf8')),
    );

    expect(offenders, `Use a semantic token instead:\n${offenders.join('\n')}`).toEqual([]);
  });
});
