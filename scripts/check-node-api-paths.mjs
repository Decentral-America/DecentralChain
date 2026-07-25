#!/usr/bin/env node
// Path-existence check ONLY — this does NOT check request/response schema conformance, HTTP method
// correctness, or parameter types. It only catches the case where node-api's hand-written fetch calls
// reference a REST path that no longer exists (or never existed) in node's documented OpenAPI spec.
// Full bidirectional type-level contract testing is a separately-scoped, larger effort.

import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { load as loadYaml } from 'js-yaml';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const OPENAPI_PATH = path.join(
  REPO_ROOT,
  '_node-scala/node/src/main/resources/swagger-ui/openapi.yaml',
);
const NODE_API_SRC = path.join(REPO_ROOT, 'packages/sdk/node-api/src/api-node');

function stripTrailingSlash(p) {
  // Trailing-slash presence/absence isn't meaningful for this check: node's akka-http routes for
  // e.g. `/leasing/info` match regardless of a trailing slash (query-param directives don't
  // enforce full path consumption), and OpenAPI conventionally never documents both variants.
  return p.length > 1 && p.endsWith('/') ? p.slice(0, -1) : p;
}

function loadDocumentedPaths() {
  const spec = loadYaml(readFileSync(OPENAPI_PATH, 'utf8'));
  // Kept as raw path keys (e.g. "/addresses/data/{address}/{key}", placeholders intact). Matching
  // happens by building a regex from each *extracted call site* (buildLiteralMatcher below) and
  // testing it against these raw strings — the `{param}` text just gets absorbed by whatever
  // wildcard the call-site regex has at that position.
  return Object.keys(spec.paths).map(stripTrailingSlash);
}

// ---------------------------------------------------------------------------------------------
// Template-literal scanning
//
// node-api's `url:` values are template literals, and a naive `` `([^`]+)` `` / `\$\{[^}]+\}`
// regex pair breaks on real call sites in this codebase in two ways:
//   1. Nested template literals inside an interpolation, e.g.
//      `/utils/seed${length ? `/${length}` : ''}` — the outer capture stops at the FIRST
//      backtick it sees, which is the nested literal's opening backtick, truncating the match.
//   2. Object-literal arguments inside an interpolation, e.g. `${query({ after })}` — a
//      non-nesting `\$\{[^}]+\}` stops at the FIRST `}`, which closes `{ after }`, not the
//      interpolation itself, leaving a dangling `)}` in the "normalized" output.
// The scanners below track nesting depth explicitly instead of assuming a flat structure.
// ---------------------------------------------------------------------------------------------

/** Returns the index of the backtick that closes the template literal opened at `openIndex`. */
function scanTemplateLiteral(content, openIndex) {
  let i = openIndex + 1;
  while (i < content.length) {
    const ch = content[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') return i;
    if (ch === '$' && content[i + 1] === '{') {
      i = scanInterpolation(content, i + 2);
      continue;
    }
    i++;
  }
  throw new Error(`Unterminated template literal starting at index ${openIndex}`);
}

/** Returns the index just past the `}` that closes the interpolation started at `start` (the
 * index right after its `${`), tracking nested `{}`, nested template literals, and string
 * literals so none of those desync the brace count. */
function scanInterpolation(content, start) {
  let i = start;
  let depth = 1;
  while (i < content.length) {
    const ch = content[i];
    if (ch === '\\') {
      i += 2;
      continue;
    }
    if (ch === '`') {
      i = scanTemplateLiteral(content, i) + 1;
      continue;
    }
    if (ch === "'" || ch === '"') {
      i = scanStringLiteral(content, i) + 1;
      continue;
    }
    if (ch === '{') {
      depth++;
      i++;
      continue;
    }
    if (ch === '}') {
      depth--;
      i++;
      if (depth === 0) return i;
      continue;
    }
    i++;
  }
  throw new Error(`Unterminated interpolation starting at index ${start}`);
}

function scanStringLiteral(content, openIndex) {
  const quote = content[openIndex];
  let i = openIndex + 1;
  while (i < content.length) {
    if (content[i] === '\\') {
      i += 2;
      continue;
    }
    if (content[i] === quote) return i;
    i++;
  }
  throw new Error(`Unterminated string literal starting at index ${openIndex}`);
}

// A query-string-building helper is always used as a trailing suffix in this codebase (see
// packages/sdk/node-api/src/tools/query.ts, and the local `afterQuery` pattern in
// api-node/assets/index.ts) and always evaluates to either `''` or a value starting with `?` —
// never to path text. Recognize it by shape so it's dropped instead of being (mis)treated as a
// required path segment.
const QUERY_HELPER_PATTERN = /^\s*(query\s*\(|[a-zA-Z_$][\w$]*Query\s*$)/;

/**
 * Converts one `url:` template literal's raw source text (the text between the outer backticks)
 * into a regex that a documented OpenAPI path can be tested against. Behavior per token:
 *   - a literal `?` (and everything after it) is dropped — query strings aren't part of "path"
 *   - a trailing query-string-helper interpolation (matches QUERY_HELPER_PATTERN, and nothing but
 *     the query string follows it) is dropped entirely, same reasoning
 *   - an interpolation containing a nested template literal — a conditionally-appended optional
 *     path segment, e.g. `/utils/seed${length ? `/${length}` : ''}` — becomes an optional
 *     `(?:/[^/]+)?` segment, since the source has no literal `/` of its own separating it from
 *     the preceding text (the ternary supplies the `/` only in its non-empty branch)
 *   - any other interpolation (`${pathSegment(x)}`, `${height}`, ...) becomes exactly one
 *     required path segment, `[^/]+`
 * literal text outside interpolations is regex-escaped and kept as-is.
 */
function buildLiteralMatcher(rawTemplateText) {
  let pattern = '';
  let display = '';
  let i = 0;
  while (i < rawTemplateText.length) {
    const ch = rawTemplateText[i];
    if (ch === '?') break; // literal query-string marker — path ends here
    if (ch === '$' && rawTemplateText[i + 1] === '{') {
      const closeIdx = scanInterpolation(rawTemplateText, i + 2);
      const exprText = rawTemplateText.slice(i + 2, closeIdx - 1);
      const remainder = rawTemplateText.slice(closeIdx).split('?')[0];
      const isTrailing = remainder === '';
      if (isTrailing && QUERY_HELPER_PATTERN.test(exprText)) {
        // query-string helper contributing nothing to the path — drop it
      } else if (exprText.includes('`')) {
        pattern += '(?:/[^/]+)?';
        display += '{optional-segment}';
      } else {
        pattern += '[^/]+';
        display += '*';
      }
      i = closeIdx;
      continue;
    }
    pattern += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    display += ch;
    i++;
  }
  pattern = stripTrailingSlash(pattern);
  display = stripTrailingSlash(display);
  return { display, regex: new RegExp(`^${pattern}$`) };
}

/**
 * Scans a `url: <expr>` property value starting at `exprStart` (just after the `url:` and any
 * whitespace) and collects every top-level string/template literal appearing in it, stopping at
 * the `,` or `}` that ends this object-literal property. This is needed because not every call
 * site is a single template literal directly:
 *   - many are plain quoted strings with no interpolation at all, e.g. `url: '/blocks/last'`
 *   - at least one is a ternary between two alternatives, e.g.
 *     `url: height ? \`/blockchain/rewards/${pathSegment(height)}\` : '/blockchain/rewards'`
 *     (both branches are real, independently-checkable paths)
 * Parens/brackets/braces are depth-tracked only so a `,` or `}` inside a nested call (e.g.
 * `pathSegment(x)`) isn't mistaken for the end of the property; literals are only collected at
 * depth 0 (directly part of the `url:` expression, not buried inside some other call's args).
 */
const OPEN_BRACKETS = new Set(['(', '[', '{']);
const CLOSE_BRACKETS = new Set([')', ']']);

function findTopLevelLiterals(content, exprStart) {
  const literals = [];
  let i = exprStart;
  let depth = 0;
  while (i < content.length) {
    const ch = content[i];
    if (ch === '`' || ch === "'" || ch === '"') {
      const close = ch === '`' ? scanTemplateLiteral(content, i) : scanStringLiteral(content, i);
      if (depth === 0) literals.push(content.slice(i + 1, close));
      i = close + 1;
      continue;
    }
    if (OPEN_BRACKETS.has(ch)) {
      depth++;
      i++;
      continue;
    }
    if (CLOSE_BRACKETS.has(ch)) {
      depth--;
      i++;
      continue;
    }
    // `}` ends the enclosing object literal (at depth 0) rather than a nested bracket; `,` at
    // depth 0 ends this property, with more properties following.
    if ((ch === '}' || ch === ',') && depth === 0) return { end: i, literals };
    if (ch === '}') depth--;
    i++;
  }
  return { end: i, literals };
}

function extractLiteralPaths() {
  const files = globSync(`${NODE_API_SRC}/**/*.ts`);
  const found = [];
  const urlPropertyPattern = /url:\s*/g;
  for (const file of files) {
    const content = readFileSync(file, 'utf8');
    let match = urlPropertyPattern.exec(content);
    while (match !== null) {
      const exprStart = match.index + match[0].length;
      const { literals, end } = findTopLevelLiterals(content, exprStart);
      for (const rawTemplateText of literals) {
        const { regex, display } = buildLiteralMatcher(rawTemplateText);
        found.push({ file: path.relative(REPO_ROOT, file), path: display, regex });
      }
      urlPropertyPattern.lastIndex = end;
      match = urlPropertyPattern.exec(content);
    }
  }
  return found;
}

const documentedPaths = loadDocumentedPaths();
const usedPaths = extractLiteralPaths();

const undocumented = usedPaths.filter(
  ({ regex }) => !documentedPaths.some((docPath) => regex.test(docPath)),
);

if (undocumented.length > 0) {
  console.error('The following node-api paths have no matching entry in node/openapi.yaml:');
  for (const { file, path: p } of undocumented) {
    console.error(`  ${file}: ${p}`);
  }
  process.exit(1);
}

console.log(
  `OK: all ${usedPaths.length} node-api path references matched a documented OpenAPI path.`,
);
