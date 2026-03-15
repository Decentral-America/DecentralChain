# Migration Prompt: ESLint + Prettier + Husky + lint-staged → Biome + Lefthook

> **Scope:** Any TypeScript project (Next.js, React, Node.js)
> **Biome Target:** 2.x (latest stable — 2.4.2 as of Mar 2026)
> **Lefthook Target:** 1.x (latest stable — 1.11.x as of Mar 2026)
> **Replaces:** eslint, eslint-config-\*, @typescript-eslint/\*, prettier, prettier-plugin-\*, husky, lint-staged (up to 10 packages → 2)

---

## Before You Start

### Inventory your current setup

Run these and save the output — you'll need it for rule mapping:

```bash
# List all lint/format packages
npm ls --depth=0 2>/dev/null | grep -iE "eslint|prettier|husky|lint-staged"

# List config files
ls -la eslint.config.* .eslintrc* .prettierrc* .prettierignore .husky/ 2>/dev/null

# Find all suppression comments
grep -rn "eslint-disable" src/ scripts/ --include="*.ts" --include="*.tsx"

# Check if tsconfig has noUncheckedIndexedAccess (affects migration strategy)
grep "noUncheckedIndexedAccess" tsconfig.json
```

### Critical context to know

1. **Does the project use Tailwind CSS v4?** → You'll need `"tailwindDirectives": true` in Biome's CSS parser config.
2. **Does tsconfig have `noUncheckedIndexedAccess: true`?** → Array indexing returns `T | undefined`. The `!` (non-null assertion) operators in regex match results are **intentional and correct**. Biome will want to remove them — you must protect them.
3. **Does the project have regex-heavy code?** (scrapers, parsers) → Expect `noAssignInExpressions` from `while ((match = regex.exec()) !== null)` patterns. These need manual conversion to `for...of matchAll()`.
4. **Does the project use emoji in regex character classes?** → Multi-codepoint emoji like `🏎️` trigger `noMisleadingCharacterClass`. Fix with `\p{Extended_Pictographic}` Unicode property escapes.

---

## Step 1 — Install Biome + Lefthook

```bash
npm install --save-dev --save-exact @biomejs/biome@latest   # 2.4.2 as of Mar 2026
npm install --save-dev @evilmartians/lefthook@latest         # 1.11.x as of Mar 2026
```

## Step 2 — Auto-Migrate (Reference Only)

Run the migration commands to get a **starting point**. Do NOT trust the output blindly:

```bash
npx @biomejs/biome migrate eslint --write --include-inspired
npx @biomejs/biome migrate prettier --write
```

> **⚠️ LESSON LEARNED:** The auto-migration produces a bloated, duplicated config that mixes v1 and v2 syntax. It's better to **read the output, then delete it and hand-craft a clean `biome.json`** using the reference below.

## Step 3 — Hand-Craft `biome.json`

Delete the auto-generated config and build from scratch. Use this structure:

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",  // 2.4.2 as of Mar 2026
  "root": true,

  // ── VCS: respect .gitignore ──
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },

  // ── File exclusions ──
  // "ignore" excludes paths; "includes" restricts scope (both optional, independent)
  "files": {
    "ignore": [
      ".next", "out", "build", "dist", "coverage",
      "src/generated", "node_modules",
      "*.db", "*.map",
      "package-lock.json", "pnpm-lock.yaml"
    ]
  },

  // ── Formatter (replaces .prettierrc.json) ──
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",        // or "single" — match your existing Prettier config
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false,
      "quoteProperties": "asNeeded"
    }
  },

  // ── JSON Formatter ──
  "json": {
    "formatter": {
      "indentStyle": "space",
      "indentWidth": 2
    }
  },

  // ── CSS Parser (required for Tailwind v4) ──
  // Without tailwindDirectives, @theme inline and @import "tailwindcss" cause parse errors
  "css": {
    "parser": {
      "cssModules": true,
      "tailwindDirectives": true
    }
  },

  // ── Linter (replaces eslint.config.mjs) ──
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,

      // A11Y: Biome's recommended set includes many a11y rules that ESLint
      // never enforced. Downgrade ALL of them to "warn" to avoid overwhelming
      // noise on first migration. Promote to "error" incrementally.
      "a11y": {
        "useAltText": "warn",
        "useButtonType": "warn",
        "useKeyWithClickEvents": "warn",
        "useSemanticElements": "warn",
        "useValidAriaProps": "warn",
        "useValidAriaValues": "warn",
        "useAriaPropsForRole": "warn",
        "useAriaPropsSupportedByRole": "warn",
        "noAriaUnsupportedElements": "warn",
        "noLabelWithoutControl": "warn",
        "noSvgWithoutTitle": "warn",
        "noStaticElementInteractions": "warn"
      },

      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedFunctionParameters": "error",
        "noUnusedImports": "error",
        "useExhaustiveDependencies": "error",
        "useHookAtTopLevel": "error",
        "useJsxKeyInIterable": "error"
      },

      "style": {
        "useConst": "error",
        "noVar": "error",
        "useImportType": {
          "level": "error",
          "options": { "style": "inlineType" }
        },
        "useAsConstAssertion": "error",
        "noNamespace": "error",
        "noCommonJs": "error",
        "useArrayLiterals": "error"
      },

      "suspicious": {
        "noExplicitAny": "warn",
        "noArrayIndexKey": "warn",
        "noDoubleEquals": "error",
        "noConsole": {
          "level": "warn",
          "options": { "allow": ["warn", "error"] }
        }
      },

      "security": {
        "noGlobalEval": "error"
      },

      // ── Nursery rules (graduating — may move to stable in future Biome releases) ──
      // Enable selectively; they can break between minor versions
      "nursery": {
        // "noFloatingPromises": "error"   // uncomment if project uses async heavily
      }
    }
  },

  // ── Overrides ──
  "overrides": [
    {
      "include": ["scripts/**", "prisma/**"],
      "linter": {
        "rules": {
          "suspicious": { "noConsole": "off" }
        }
      }
    }
    // Add more overrides as needed — see "Common Override Patterns" below
  ]
}
```

### Common Override Patterns

**Regex-heavy code** (scrapers, parsers) — protect `!` assertions and unused-looking private members:

```jsonc
{
  "include": ["src/lib/scraper/**"],
  "linter": {
    "rules": {
      "style": { "noNonNullAssertion": "off" },
      "correctness": { "noUnusedPrivateClassMembers": "off" }
    }
  }
}
```

> **⚠️ LESSON LEARNED:** Biome's `--unsafe` auto-fix converts `match[1]!` to `match[1]?.`, which **breaks TypeScript** when `noUncheckedIndexedAccess: true` (array indexing returns `T | undefined`, making the `!` assertion correct and necessary). The `--unsafe` flag also **deletes private class members** it thinks are unused. Protect these with overrides BEFORE running any auto-fixes.

**Test files** — allow `any` for mocks:

```jsonc
{
  "include": ["**/*.test.ts", "**/*.spec.ts"],
  "linter": {
    "rules": {
      "suspicious": { "noExplicitAny": "off" }
    }
  }
}
```

## Step 4 — Update `package.json`

### Scripts

```jsonc
{
  "scripts": {
    "lint": "biome check --write .",
    "lint:check": "biome check .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "bulletproof": "biome check --write . && npm run typecheck && npm run test",
    "bulletproof:check": "biome check . && npm run typecheck && npm run test",
    "prepare": "lefthook install"
  }
}
```

### Remove `lint-staged` config

Delete the entire `"lint-staged"` block from `package.json`. Lefthook handles staged-file filtering natively.

## Step 5 — Create `lefthook.yml`

```yaml
# lefthook.yml
min_version: 1.11.0

output:
  - execution
  - summary
  - failure

pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.{ts,tsx,js,jsx,mjs,cjs,json,css}"
      run: npx @biomejs/biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true
    typecheck:
      glob: "*.{ts,tsx}"
      run: npm run typecheck
      skip:
        - merge
        - rebase

commit-msg:
  commands:
    conventional:
      run: 'grep -qE "^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+" {1}'
```

**Key behaviors:**
- `min_version` — ensures every contributor has a compatible Lefthook binary.
- `output` — controls verbosity: shows execution progress, summary, and failures only.
- `parallel: true` — lint and typecheck run **simultaneously** (was sequential with Husky).
- `{staged_files}` — Lefthook expands this to only staged files (same as lint-staged).
- `stage_fixed: true` — auto-fixes get re-staged before commit completes.
- `skip: [merge, rebase]` — skips typecheck during merge/rebase (avoids blocking conflict resolution).
- `commit-msg` hook — validates commit messages against **Conventional Commits** format. Rejects non-conforming messages before they're written.
- **Both lint AND typecheck must pass** — same enforcement as the old `npx lint-staged && npm run typecheck`.
- If either fails, the commit is **blocked**.

> **Note:** The `commit-msg` hook uses `{1}` which Lefthook expands to the commit message file path.

Install the hooks:

```bash
npx lefthook install
```

> If migrating from Husky, you may need `--reset-hooks-path` to clear the old `core.hooksPath`:
> ```bash
> npx lefthook install --reset-hooks-path
> ```

## Step 6 — Convert `eslint-disable` Comments

Biome uses a different suppression syntax. The reason after the colon is **mandatory**:

| ESLint | Biome |
|--------|-------|
| `// eslint-disable-next-line rule-name` | `// biome-ignore lint/category/ruleName: reason` |
| `/* eslint-disable rule-name */` | `// biome-ignore lint/category/ruleName: reason` |

Common conversions:

```ts
// OLD: // eslint-disable-next-line react-hooks/exhaustive-deps
// NEW: // biome-ignore lint/correctness/useExhaustiveDependencies: debounce ref is stable

// OLD: // eslint-disable-next-line @typescript-eslint/no-explicit-any
// NEW: // biome-ignore lint/suspicious/noExplicitAny: third-party API returns untyped data
```

Find all instances:
```bash
grep -rn "eslint-disable" src/ scripts/ --include="*.ts" --include="*.tsx"
```

> If Biome doesn't flag the same pattern, remove the comment entirely rather than converting it.

## Step 7 — Remove Old Dependencies

```bash
npm uninstall eslint eslint-config-next eslint-config-prettier \
  @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  typescript-eslint prettier prettier-plugin-tailwindcss \
  husky lint-staged
```

## Step 8 — Delete Old Config Files

```bash
rm -f eslint.config.mjs .eslintrc* .prettierrc.json .prettierignore
rm -rf .husky
```

## Step 9 — Apply Safe Auto-Fixes

**Order matters. Follow this exact sequence:**

### 9a. Format only (zero risk)

```bash
npx biome format --write .
```

### 9b. Safe lint fixes (no `--unsafe` flag)

```bash
npx biome check --write .
```

This handles: import sorting, `useConst`, `noUnusedImports`, `useNodejsImportProtocol`, etc.

### 9c. Check what remains

```bash
npx biome check --max-diagnostics=200 . 2>&1 | grep -oE 'lint/[a-zA-Z/]+' | sort | uniq -c | sort -rn
```

### 9d. Fix remaining errors manually

The most common manual fixes needed:

| Rule | Pattern | Fix |
|------|---------|-----|
| `noAssignInExpressions` | `while ((match = regex.exec(str)) !== null)` | `for (const match of str.matchAll(regex))` — ensure regex has `g` flag |
| `noAssignInExpressions` | `while ((node = walker.nextNode()))` | `for (let node = walker.nextNode(); node; node = walker.nextNode())` |
| `noMisleadingCharacterClass` | `[🚗🏎️🔥✅]` in regex | Replace with `\p{Extended_Pictographic}` Unicode property escape with `/gu` flags |
| `noControlCharactersInRegex` | `[\x00-\x1F]` in sanitization | Add `// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional` |
| `useIterableCallbackReturn` | `arr.forEach(x => set.add(x))` | `for (const x of arr) set.add(x)` |
| `noInvalidUseBeforeDeclaration` | `useEffect` before `useCallback` | Reorder hooks: declare `useCallback` above the `useEffect` that references it |
| `useButtonType` | `<button>` without `type` | Add `type="button"` (or `type="submit"` for forms) |

### 9e. Unsafe fixes (ONLY after overrides are in place)

Once you've confirmed your overrides protect `!` assertions and private members:

```bash
npx biome check --write --unsafe .
```

> **⚠️ CRITICAL:** Never run `--unsafe` globally without the `noNonNullAssertion: "off"` override for files that use `!` assertions on array/regex matches. The `--unsafe` flag silently converts `match[1]!` to `match[1]?.`, breaking TypeScript when `noUncheckedIndexedAccess: true`.

### 9f. Verify TypeScript after every batch of fixes

```bash
npm run typecheck 2>&1 | grep "error TS" | wc -l
```

If errors appear, the `--unsafe` flag likely converted `!` to `?.` somewhere. Identify the files and restore them:

```bash
# Show which files have errors
npm run typecheck 2>&1 | grep "error TS" | sed 's/(.*//' | sort -u

# Restore specific files and re-apply safe-only fixes
git checkout -- path/to/broken-file.ts
npx biome check --write path/to/broken-file.ts
```

## Step 10 — VS Code Integration

### Create `.vscode/settings.json`

```jsonc
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[typescriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
  "[javascript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[javascriptreact]": { "editor.defaultFormatter": "biomejs.biome" },
  "[json]": { "editor.defaultFormatter": "biomejs.biome" },
  "[jsonc]": { "editor.defaultFormatter": "biomejs.biome" },
  "[css]": { "editor.defaultFormatter": "biomejs.biome" }
}
```

### Commit it (unignore if needed)

If `.vscode` is in `.gitignore`, add an exception:

```gitignore
.vscode
!.vscode/settings.json
```

Then `git add -f .vscode/settings.json`.

### Install the extension

Extension ID: `biomejs.biome`. Uninstall `esbenp.prettier-vscode` and `dbaeumer.vscode-eslint` for the workspace.

## Step 11 — Final Validation

```bash
# Must show 0 errors (warnings are OK)
npx biome check .

# Must show 0 TypeScript errors
npm run typecheck

# Must pass all tests
npm run test

# Or run all three:
npm run bulletproof
```

## Step 12 — Commit

```bash
git add -A
git commit -m "build: migrate to Biome + Lefthook

- Replace eslint, prettier, husky, lint-staged (N packages) with biome + lefthook (2)
- Hand-craft biome.json with equivalent rule configuration
- Add lefthook.yml with parallel pre-commit: lint + typecheck
- Add Conventional Commits validation via commit-msg hook
- Convert eslint-disable comments to biome-ignore syntax
- Convert while/exec patterns to for-of/matchAll (if applicable)
- Add .vscode/settings.json for Biome editor integration
- Delete old config files: eslint.config.mjs, .prettierrc.json, .prettierignore, .husky/"
```

---

## Pitfall Reference

These are real issues encountered during migration. Check for each one:

### 1. Tailwind v4 CSS Parse Errors

**Symptom:** Biome throws parse errors on `@theme inline`, `@import "tailwindcss"`, or other Tailwind directives.

**Fix:** Add to biome.json:
```jsonc
"css": { "parser": { "tailwindDirectives": true } }
```

### 2. `files.includes` vs `files.ignore` Are Separate Fields

**Symptom:** Biome scans files you expected to exclude, or excludes files you expected to include.

**Fix:** Use `files.ignore` for exclusions and `files.includes` for restricting scope — they are **separate fields**, not one field with `!` negation patterns:
```jsonc
"files": { "ignore": ["dist", "node_modules", "coverage"] }
```
If you also need to restrict Biome to specific directories, add `includes`:
```jsonc
"files": { "includes": ["src/**/*.ts"], "ignore": ["dist"] }
```

### 3. `--unsafe` Breaks Non-Null Assertions

**Symptom:** TypeScript errors like `Type 'string | undefined' is not assignable to parameter of type 'string'` appear after running `--unsafe`.

**Cause:** `--unsafe` converts `match[1]!` (non-null assertion) to `match[1]?.` (optional chaining). With `noUncheckedIndexedAccess: true`, the `!` was correct.

**Fix:** Add override `"noNonNullAssertion": "off"` for affected directories BEFORE running `--unsafe`. If already broken, restore files with `git checkout --` and re-apply safe-only fixes.

### 4. `--unsafe` Deletes Private Class Members

**Symptom:** TypeScript errors like `Property 'conf' does not exist on type 'MyClass'`.

**Cause:** `--unsafe` applies `noUnusedPrivateClassMembers` by removing members it thinks are unused.

**Fix:** Add override `"noUnusedPrivateClassMembers": "off"` for affected directories.

### 5. Emoji in Regex Character Classes

**Symptom:** `noMisleadingCharacterClass` on regex like `/[🚗🏎️🔥]/gu`.

**Cause:** Emoji like `🏎️` are multi-codepoint (base + variation selector). A character class treats each codepoint separately.

**Fix:** Replace with Unicode property escape: `/\p{Extended_Pictographic}/gu`

### 6. Auto-Fix Blocked by Unfixable Errors

**Symptom:** `biome check --write` says "No fixes applied" even though there are fixable issues.

**Cause:** The presence of non-auto-fixable errors (like `noAssignInExpressions`) blocks all auto-fixes in affected files.

**Fix:** Fix the manual issues first, then re-run `--write`. Process in order: manual fixes → safe auto-fixes → unsafe auto-fixes.

### 7. React Hook Declaration Order

**Symptom:** `noInvalidUseBeforeDeclaration` — a `useCallback` referenced in a `useEffect` dependency array, but declared after it.

**Fix:** Move the `useCallback` declaration above the `useEffect` that uses it. Hook declaration order must match reference order.

### 8. Husky `core.hooksPath` Conflict

**Symptom:** `lefthook install` fails with `core.hooksPath is set locally to '.husky/_'`.

**Fix:** `npx lefthook install --reset-hooks-path`

### 9. Button Type Duplication

**Symptom:** Adding `type="button"` globally via find/replace creates `noDuplicateJsxProps` errors on buttons that already had `type="submit"`.

**Fix:** Only add `type="button"` to buttons that don't already have a `type` attribute. Check with:
```bash
grep -n "<button" src/ -r --include="*.tsx" | grep -v "type="
```

### 10. Control Characters in Sanitization Regex

**Symptom:** `noControlCharactersInRegex` on `/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g`.

**Cause:** These control characters are intentional — it's a string sanitization function.

**Fix:** Add suppression:
```ts
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — strips C0/C1 control chars
.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
```

---

## Verification Checklist

- [ ] `npx biome check .` → 0 errors (warnings OK)
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run test` → all passing
- [ ] `npm run bulletproof` → exits 0
- [ ] Pre-commit hook works: stage a file with a lint error, `git commit` blocks it
- [ ] Commit-msg hook works: `git commit -m "bad message"` is rejected, `git commit -m "fix: valid message"` passes
- [ ] VS Code format-on-save works with Biome extension
- [ ] No `eslint-disable` comments remain: `grep -rn "eslint-disable" src/`
- [ ] No old config files remain: `ls eslint.config.* .eslintrc* .prettierrc* .prettierignore .husky/ 2>/dev/null`
- [ ] No old packages remain: `npm ls 2>/dev/null | grep -iE "eslint|prettier|husky|lint-staged"`

## Rollback Plan

If issues arise, revert the migration commit:

```bash
git revert HEAD
npm install
```

All old config files and dependencies will be restored.
