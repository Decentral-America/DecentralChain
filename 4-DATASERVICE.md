Ran terminal command:  npm info @koa/router version && echo "---" && npm info koa version && echo "---" && npm info @koa/cors version && echo "---" && npm info ramda version && echo "---" && npm info winston version && echo "---" && npm info qs version && echo "---" && npm info pg-promise version && echo "---" && npm info lru-cache version && echo "---" && npm info knex version && echo "---" && npm info chalk version

Ran terminal command:  npm info koa-router dist-tags && echo "---" && npm info ramda dist-tags 2>/dev/null | head -3 && echo "---ESM: ramda?" && node --input-type=module --eval "import * as R from 'ramda'; console.log(typeof R.map)" 2>/dev/null || echo "ramda not installed locally" && echo "---ramda package type:" && node -e "const p = require('/Users/jourlez/Documents/Code/Blockchain/Ecosystem/DecentralChain/node_modules/ramda/package.json'); console.log('type:', p.type, 'exports:', JSON.stringify(Object.keys(p.exports||{}).slice(0,3)))" 2>/dev/null || echo "ramda not in root" && echo "---winston ESM?" && npm pack winston --dry-run 2>/dev/null | head -3 && npm info winston dist-tags 2>/dev/null | head -3

Ran terminal command:  node -e "
const p = require('/Users/jourlez/Documents/Code/Blockchain/Ecosystem/DecentralChain/apps/data-service/node_modules/ramda/package.json');
console.log('ramda type:', p.type);
console.log('ramda exports:', JSON.stringify(Object.keys(p.exports||{}).slice(0,4)));
console.log('ramda module field:', p.module);
" 2>/dev/null
echo "---knex breakage check---"
npm info knex dist-tags 2>/dev/null | head -2
echo "---pg-native ESM---"
node -e "const p = require('/Users/jourlez/Documents/Code/Blockchain/Ecosystem/DecentralChain/apps/data-service/node_modules/pg-promise/package.json'); console.log('pg-promise version:', p.version, 'type:', p.type)" 2>/dev/null
echo "---check-env status---"
npm info check-env deprecated 2>/dev/null
echo "---@effect/schema status---"
npm info @effect/schema dist-tags 2>/dev/null | head -2

Ran terminal command:  npm info knex dist-tags 2>/dev/null && echo "---" && npm info @effect/schema latest 2>/dev/null | head -5 && echo "---effect/Schema status in v3---" && npm pack effect --dry-run 2>/dev/null | head -2 && node -e "
// Check if effect v3 has Schema built-in
const { execSync } = require('child_process');
const out = execSync('npm pack effect --dry-run --json 2>/dev/null').toString();
const data = JSON.parse(out);
const hasSchema = data[0]?.files?.some(f => f.path?.includes('Schema'));
console.log('effect has Schema built-in:', hasSchema);
" 2>/dev/null && echo "---lru-cache v11 API---" && npm info lru-cache@11 description 2>/dev/null | head -3





Fetched https://github.com/isaacs/node-lru-cache/blob/main/CHANGELOG.md

Fetched https://knexjs.org/changelog.html

Compacted conversationGood — all research is confirmed. Here is the full, research-backed modernization plan.

---

## data-service Full Modernization Plan

All versions verified from npm registry and changelogs as of this session.

---

### Phase 0 — `@waves/*` → `@decentralchain/*` ✅ DONE

All 51 source files patched. No remaining `@waves/*` references.

---

### Phase 1 — Dependency Overhaul (package.json)

**Remove entirely:**
| Package | Reason |
|---|---|
| `folktale` | Deprecated CJS-only. Replaced by `effect` |
| `joi@^13` | v13 extension API incompatible with any modern joi. Replaced by `effect/Schema` |
| `json-colorizer@^1` | Zero-maintenance, replaced by winston's built-in colorize transport |
| `merge-descriptors@^1` | No longer needed post-ESM refactor |
| `jest@^24`, `ts-jest@^23`, `@types/jest@^23` | Replaced by Vitest |
| `ts-node@^7` | Replaced by `tsx` or removed (tsdown bundles the server) |
| `check-env@^1` | Replace with 3 lines of inline validation |

**Add:**
| Package | Version | Reason |
|---|---|---|
| `effect` | `^3.21.2` | Replaces folktale (Task→Effect, Maybe→Option, Result→Either) + Schema (replaces joi) |
| `vitest` | `^4.1.5` | Test runner |
| `@vitest/coverage-v8` | `^4.1.5` | Coverage |

**Upgrade (with breaking-change notes):**
| Old | New | Breaking changes |
|---|---|---|
| `koa@^2.5` | `koa@^2.15` | Stay on v2.x — koa v3 requires Node 22+ and changes body parsing. v2.15 is latest stable |
| `koa-router@^7` | `@koa/router@^15.5.0` | Package renamed to scoped. Import: `import Router from '@koa/router'` |
| `@koa/cors` (if present) | `@koa/cors@^5.0.0` | ESM-compatible |
| `knex@^0.16` | `knex@^3.2.10` | **MAJOR**: ESM import is `import { knex } from 'knex/knex.mjs'`; RETURNING format changed; Node 16+ required (satisfied) |
| `pg-promise@^8` | `pg-promise@^12.6.2` | API-compatible for basic queries; verify advanced features |
| `lru-cache@^5` | `lru-cache@^11.3.6` | **MAJOR**: `import { LRUCache } from 'lru-cache'`; constructor option `maxAge` → `ttl`; named export only (no default) |
| `ramda@^0.25` | `ramda@^0.32.0` | Has `"module"` field for ESM consumers; API-stable |
| `winston@^3.0.0-rc4` | `winston@^3.19.0` | Stable release; same API |
| `chalk@^2` | `chalk@^5.6.2` | **ESM-ONLY** since v5 — cannot be `require()`d. Requires `"type": "module"` |
| `qs@^6.5` | `qs@^6.15.1` | API-stable |
| `pg-native@^3` | `pg-native@^3.7.0` | Latest patch |

**Types to update/remove:**
- Remove: `@types/folktale/*` (stubs in `src/@types/` — delete the whole directory after migration)
- Remove: `@types/jest` → replaced by Vitest globals
- Remove: custom `src/@types/ramda`, `src/@types/knex` stubs — they have first-party types now
- Add: `@types/koa@^2.15`, `@types/koa__router@^12` (scoped package)
- Bump: `@types/ramda@^0.32.0`, `@types/node` → use `catalog:` from workspace

---

### Phase 2 — TypeScript + Build Config

**Decision: Use `tsdown` for bundling** (matches all 21 other packages; enables `"moduleResolution": "bundler"`)

**tsconfig.json** — rewrite to extend base:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```
- Remove: `allowJs`, `baseUrl`, `target` (inherited from base), `moduleResolution: "node"`, `module: "commonjs"`
- The base uses `"moduleResolution": "bundler"` — correct for tsdown builds

**package.json** additions:
```json
{
  "type": "module"
}
```

**Add `tsdown.config.ts`:**
```ts
import { defineConfig } from 'tsdown';
export default defineConfig({
  entry: ['src/index.ts', 'src/daemons/pairs/index.ts'],
  format: 'esm',
  platform: 'node',
  outDir: 'dist',
});
```

**Add `vitest.config.ts`:**
```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.integration.test.ts'],
    coverage: { provider: 'v8' },
  },
});
```

**Update project.json** Nx targets:
- `build`: `tsdown --config tsdown.config.ts`
- `typecheck`: `tsc --noEmit`
- `test`: `vitest run`
- Remove manual `lint`, `lint:check`, `lint:fix` (already inferred by biome plugin)

**Update biome.json** — after JS→TS, remove JS file exclusions:
```json
{
  "extends": "//",
  "root": false
}
```

---

### Phase 3 — JS → TypeScript Conversion (127 files)

Systematic conversion per directory. All `require()` → `import`, `module.exports` → named/default exports. Each file gains `.ts` extension.

**Order of conversion (dependencies-first):**
1. `src/logger/` (3 files) — standalone, no internal deps
2. `src/errorHandling/getErrorMessage.js`
3. `src/utils/db/knex/lib.js`, `src/utils/db/knex/index.js`
4. `src/utils/db/index.js`
5. `src/middleware/` (4 files)
6. `src/daemons/utils/`, `src/daemons/presets/`
7. All `src/services/*/` SQL files (the many `.js` files containing SQL strings)
8. Test files (`.test.js` → `.test.ts`) — last, after source is clean

**Delete:** `src/@types/folktale/`, `src/@types/jest/`, `src/@types/knex/`, `src/@types/ramda/`, `src/@types/ramda-adjunct/`

**Delete:** `src/utils/validation/joi.js` (replaced entirely in Phase 5)

---

### Phase 4 — Effect Migration (folktale → `effect`)

The core of the work. Migration follows a mechanical pattern — start from the leaf modules and work inward.

**`Maybe` → `Option`:**
```ts
// Before
import { fromNullable, Just, Nothing } from 'folktale/maybe';
import type { Maybe } from 'folktale/maybe';
const x = Maybe.fromNullable(value);
x.matchWith({ Just: ({ value: v }) => f(v), Nothing: () => g() });

// After
import { Option } from 'effect';
const x = Option.fromNullable(value);
Option.match(x, { onSome: (v) => f(v), onNone: () => g() });
```

**`Task` → `Effect.Effect`:**
```ts
// Before
import Task from 'folktale/concurrency/task';
type PgResult<T> = Task<DbError, T>;
const query = <T>(...): PgResult<T> =>
  Task.task(({ resolve, reject }) => {
    db.any(sql).then(resolve).catch(reject);
  });

// After
import { Effect } from 'effect';
type PgResult<T> = Effect.Effect<T, DbError>;
const query = <T>(...): PgResult<T> =>
  Effect.tryPromise({
    try: () => db.any(sql),
    catch: (e) => new DbError(e),
  });
```

**Key `Task` → `Effect` mapping:**

| Folktale | Effect |
|---|---|
| `Task.of(value)` | `Effect.succeed(value)` |
| `Task.rejected(err)` | `Effect.fail(err)` |
| `task.map(f)` | `Effect.map(f)` (in pipe) |
| `task.chain(f)` | `Effect.flatMap(f)` (in pipe) |
| `task.bimap(onFail, onSuccess)` | `Effect.mapBoth({ onFailure, onSuccess })` (in pipe) |
| `task.mapRejected(f)` | `Effect.mapError(f)` (in pipe) |
| `Task.waitAny([...])` | `Effect.raceAll([...])` |
| `.run().promise()` | `Effect.runPromise(effect)` |
| `fromPromised(fn)` | `Effect.tryPromise({ try: fn, catch: mapErr })` |

**`Result` → `Either`:**
```ts
// Before
import { Ok, Error as Err } from 'folktale/result';

// After
import { Either } from 'effect';
// Either.right(value) = Ok, Either.left(err) = Err
```

**Migration order:**
1. `src/types/` — update type aliases first
2. `src/utils/fp/` — the fp utility wrappers
3. `src/db/driver/pg.ts` — the foundational Task layer; all services depend on this
4. `src/services/*/repo/*.ts` — repositories
5. `src/services/*/service.ts` — service layer
6. `src/http/` — HTTP layer (using Effect at the route level)
7. `src/daemons/` — background daemon effects

**The `pipe` pattern:** Effect uses `pipe()` for chaining rather than method chaining:
```ts
// Before (method chain)
task.map(f).chain(g).mapRejected(h)

// After
pipe(effect, Effect.map(f), Effect.flatMap(g), Effect.mapError(h))
```

---

### Phase 5 — `effect/Schema` Replaces joi

**New file:** `src/utils/validation/schema.ts`

All 6 custom joi validators become Schema filters:
```ts
import { Schema, pipe } from 'effect';

export const Base58 = pipe(Schema.String, Schema.filter((s) => isBase58(s), {
  message: () => 'must be base58',
}));

export const AssetId = pipe(Schema.String, Schema.filter((s) => s === 'WAVES' || isBase58(s)));
export const Period = Schema.Literal('1m', '5m', '15m', '30m', '1h', '3h', '6h', '12h', '1d', '1w');
// etc.
```

All route `parse.ts` files replace `joi.validate(...)` with `Schema.decodeUnknown(MySchema)(input)`.

---

### Phase 6 — `lru-cache` API Update (4 files)

```ts
// Before (v5)
import * as LRU from 'lru-cache';
const cache = new LRU({ max: 100, maxAge: 60_000 });

// After (v11)
import { LRUCache } from 'lru-cache';
const cache = new LRUCache<string, MyValue>({ max: 100, ttl: 60_000 });
```

Files:
- `src/services/assets/repo/cache.ts`
- `src/services/pairs/repo/cache.ts`
- `src/services/rates/ThresholdAssetRateService.ts`
- `src/services/rates/repo/impl/RateCache.ts`

---

### Phase 7 — knex API Update (0.16 → 3.2)

**ESM import change (critical):**
```ts
// Before
import Knex from 'knex';

// After (knex 3.2.8+ reverted to this form for ESM)
import { knex } from 'knex/knex.mjs';
```

**Key 0.16 → 3.x breaking changes to verify against the codebase:**
- `RETURNING` format changed — returns objects consistently (was dialect-dependent)
- `insert` ignores `undefined` values (add `useNullAsDefault: true` for SQLite — not needed for pg)
- TypeScript 4.1+ required (satisfied with TS 6)
- The pointfree knex utilities in `src/utils/db/knex/lib.js` need verification that curried `knex(table).select()` chains still work — API is stable for basic queries

---

### Phase 8 — Test Migration (jest → Vitest)

**Delete:** `config/jest.config.unit.json`, `config/jest.config.integration.json`, `config/jest.extentions.js`

**Add:** `vitest.config.ts` (see Phase 2)

**Port custom matchers** from `jest.extentions.js`:
```ts
// Before (folktale-specific)
expect(result).toBeJust(42);
expect(result).toBeNothing();

// After (Effect Option)
import { Option } from 'effect';
expect(Option.isSome(result) && result.value === 42).toBe(true);
// Or add a custom matcher:
expect.extend({
  toBeOption: (received, expected) => ({
    pass: Option.isSome(received) && received.value === expected,
    message: () => `expected Option.some(${expected})`,
  }),
  toBeNone: (received) => ({
    pass: Option.isNone(received),
    message: () => 'expected Option.none',
  }),
});
```

**API compat (no changes needed):**
- `jest.fn()` → `vi.fn()` (global `vi` replaces `jest`)
- `jest.spyOn()` → `vi.spyOn()`
- `afterEach(() => jest.clearAllMocks())` → `afterEach(() => vi.clearAllMocks())`
- `toMatchSnapshot()` — works identically
- `--runInBand --detectOpenHandles` → removed (Vitest handles this natively)

**All `.test.js` → `.test.ts`** as part of Phase 3.

---

### Phase 9 — Quality Gates & Monorepo Integration

1. **lefthook.yml** — add to data-service (same pattern as packages)
2. **Remove exclusions** in root scripts/configs:
   - Remove `!apps/data-service/**` from root biome.json `files.includes` (if present)
   - Add `data-service` to root bulletproof typecheck/test pipeline
3. **Validate boundaries:** `node scripts/check-boundaries.mjs` — data-service is `scope:app`, may depend on any package ✓

---

### Phase 10 — Dockerfile

```dockerfile
# Before
CMD ["node", "dist/index.js"]

# After (tsdown outputs .mjs)
CMD ["node", "dist/index.mjs"]
```

Verify `pg-native` compiles with updated `pg-promise@^12` (native bindings API is stable).

---

### Execution Order

| Priority | Phase | Estimated complexity |
|---|---|---|
| 1 | Phase 1 (package.json) | Low |
| 2 | Phase 2 (tsconfig + vitest.config) | Low |
| 3 | Phase 3 (JS→TS conversion) | High (mechanical) |
| 4 | Phase 6 (lru-cache, 4 files) | Low |
| 5 | Phase 7 (knex import) | Low |
| 6 | Phase 8 (test migration) | Medium |
| 7 | Phase 5 (effect/Schema) | Medium |
| 8 | Phase 4 (Effect migration) | High (architectural) |
| 9 | Phase 9 (quality gates) | Low |
| 10 | Phase 10 (Dockerfile) | Trivial |

Phase 4 (Effect migration) is the largest. It is safely deferred until after all JS is converted to TypeScript — the TypeScript compiler will surface every folktale usage as a type error once folktale is removed from package.json, giving a precise TODO list.

Ready to begin execution on Phase 1 whenever you say go.

