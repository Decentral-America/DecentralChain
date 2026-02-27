Migration Summary — browser-bus (formerly waves-browser-bus)

Files changed:
  - package.json (name, repository, bugs, added description/keywords/author/license/homepage)
  - package-lock.json (name field updated)
  - readme.md (fully rewritten — translated from Russian, rebranded to DecentralChain)
  - tsconfig.json (added skipLibCheck for TS 4.9 compat)
  - src/bus/Bus.ts (fixed strict TS errors: symbol-to-string, unknown catch type)
  - src/adapters/WindowAdapter.ts (fixed window.top null check)
  - test/WindowAdapter.test.ts (fixed postMessage type signature)

Waves references found: 7 (package.json: 3, package-lock.json: 2, readme.md: 2)
Waves references removed: 7
Protocol constants changed: No — no message type constants contained "waves"
  The postMessage protocol is fully blockchain-agnostic. No backward compatibility concerns.

Tests: 28/28 pass
Build: pass (tsc + browserify + uglifyjs)

New package name: @decentralchain/browser-bus
New repo target: https://github.com/Decentral-America/browser-bus

Additional changes:
  - Upgraded TypeScript from ^3.3.3 to ~4.9
  - Replaced deprecated `uglifyjs` package with `uglify-js`
  - Removed stale package-lock.json pointing to private artifactory registry
  - Fixed 3 strict TypeScript errors introduced by the TS upgrade

@waves/* dependencies: NONE (only dependency: typed-ts-events 1.1.1)

Remaining concerns:
  - The repo needs to be pushed to a GitHub remote (Decentral-America/browser-bus or personal fork)
  - npm publish to @decentralchain scope requires npm org access
  - Team lead review needed before publishing
