# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed

- **BREAKING**: Migrated build system from webpack to Vite
- Replaced HtmlWebpackPlugin EJS templates with static HTML entry files
- Replaced webpack multi-config array with sequential Vite builds via `scripts/build.mjs`
- Replaced Babel pipeline with esbuild (via Vite) + `@vitejs/plugin-react` for prismjs plugin only
- Replaced `ProvidePlugin` Buffer polyfill with custom Vite `bufferPolyfill` plugin
- Renamed all `.styl` files to `.module.styl` for Vite CSS module detection
- Updated TypeScript types from `webpack/module` to `vite/client`
- Updated GitHub Actions (`actions/checkout@v6`, `github/codeql-action@v3`)
- Removed deprecated `version` key from `docker-compose.yml`
- Replaced `styfle/cancel-workflow-action` with native `concurrency` in CI
- Replaced deprecated `set-output` with `$GITHUB_OUTPUT` in pull-migrations.yml
- Upgraded Biome `noExplicitAny` from `off` to `warn` for production code
- Aligned `biome.json` with DCC ecosystem standard (`recommended: true`, `arrowParentheses: always`, errors for `noUnusedVariables`/`noUnusedImports`/`noUnusedFunctionParameters`, added `useImportType`/`noCommonJs`)
- Rebranded `LICENSE.md` from Keeper Wallet/Waves to Cubensis Connect/DecentralChain
- Added `engines`, `repository`, `license`, `author` to `package.json`
- Removed stale `postcss-normalize` devDependency
- Removed duplicate `lint:typescript` script (use `typecheck` everywhere)

### Fixed

- Fixed `CONTRIBUTING.md` GitHub Issues URL to correct org/repo
- Fixed Biome lint errors: `useLiteralKeys` in `vite.config.ts`, unused import in `vitest.config.ts`
- Replaced all ESLint-disable comments with Biome-ignore equivalents
- Changed `dev` script to set `NODE_ENV=development` for development builds
- Migrated test imports from `@waves/*` to `@decentralchain/*` (bignumber, marshall, ts-types)
- Removed stale `webpack/module` from `test/tsconfig.json` types
- Fixed unused catch variables in test helpers

### Added

- `vite.config.ts` — shared Vite configuration for dev, build, and test
- `scripts/build.mjs` — production build orchestrator (UI pages, background, contentscript, inpage)
- `popup.html`, `accounts.html`, `notification.html` — Vite HTML entry points
- `SECURITY.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `CHANGELOG.md`
- `/coverage` to `.gitignore`

### Removed

- `webpack.config.js`
- `.babelrc.json`
- `.browserslistrc`
- `scripts/PlatformPlugin.js`
- `src/index.ejs`
- 14 webpack-related devDependencies
