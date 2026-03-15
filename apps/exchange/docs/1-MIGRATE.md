# Phase 0 — Universal Migration & Modernization Prompt

> **Version**: 2.1.0 — March 6, 2026
> **Scope**: Any repository — whether `@waves/*` legacy, outdated `@decentralchain/*`, or greenfield
> **Goal**: Produce a **production-grade, institutionally credible, ESM-only** `@decentralchain/*` package that meets the exact standards of all 19 published DecentralChain SDK libraries
>
> **Important**: This prompt is **timeless by design**. All dependency versions use
> `{{LATEST}}` semantics — the AI executing this prompt MUST resolve them to the
> latest stable versions at execution time. Dated references (e.g. `~X.Y.Z as of Mar 2026`)
> are sanity-check baselines only, NOT pins.
>
> **Relationship to other phases:**
> - **1-MIGRATE.md** (this file) — Full migration and modernization. Use FIRST.
> - **2-BULLETPROOF.md** — Quality assurance system. Already embedded here.
> - **3-MODERNIZE.md** — Detailed modernization specs. Already embedded here.
> - **4-AUDIT.md** — Final security audit. Use AFTER this prompt completes.
>
> This prompt **supersedes and combines** phases 1 and 2 into a single, exhaustive
> execution plan. After running this, skip directly to phase 3 (security audit).

---

## How to Use This File

1. **Open the target repository** (legacy `@waves/*`, outdated `@decentralchain/*`, or new project).
2. **Copy everything below the `--- BEGIN PROMPT ---` line** into your AI assistant.
3. **Fill in the `[VARIABLES]` section** at the top with project-specific values.
4. The AI will execute every step autonomously — no permission needed.
5. After completion, run `4-AUDIT.md` as the final gate before publishing.

All decisions below are **pre-made**. The AI should NOT ask for permission — **execute**.

---

## Ecosystem Onboarding — Know What You're Migrating

Before touching code, understand the two ecosystems and how they relate.

### What is DecentralChain?

**DecentralChain** is an open blockchain protocol and development toolset for Web 3.0 applications and decentralized solutions. It is a **fork of the Waves blockchain** maintained by **Blockchain Costa Rica** (the `Decentral-America` GitHub org). It preserves Waves' core protocol (LPoS consensus, Ride smart contracts, transaction types, binary formats) while rebranding, adding ecosystem features (carbon credits, inter-chain gateway, native swap), and maintaining an independent network.

| Property | Value |
|:---------|:------|
| **Consensus** | Leased Proof of Stake (LPoS) |
| **Native Token** | DecentralCoin (DCC) |
| **Smart Contract Language** | Ride (non-Turing-complete, functional, expression-based) |
| **Block Time** | ~2 seconds (M5 protocol — microblocks) |
| **Chain IDs** | `W` (Mainnet), `T` (Testnet), `S` (Stagenet) — same as Waves |
| **Organization** | Blockchain Costa Rica / Decentral-America |
| **Copyright** | © 2023 Blockchain Costa Rica |

### Relationship to Waves

DecentralChain's SDK packages (`@decentralchain/*`) are **direct migrations** of the original Waves SDK packages (`@waves/*`). The protocol semantics, transaction types, binary formats, cryptographic primitives, and Ride language are fundamentally the same. What changes:

| What Changes | What Stays the Same |
|:-------------|:--------------------|
| npm scope: `@waves/*` → `@decentralchain/*` | All transaction types and binary formats |
| Branding: "Waves" → "DecentralChain" | Ride smart contract language |
| Network endpoints | LPoS consensus mechanism |
| Explorer / Exchange URLs | Cryptographic primitives (Curve25519, Blake2b256, Keccak256, Base58) |
| GitHub org: `wavesplatform` → `Decentral-America` | Address format and derivation |
| Tooling modernized to 2025+ standards | Protobuf serialization |

### Concept Mapping — Waves → DecentralChain

This table maps every core concept between the two ecosystems. Use it to understand what you're reading in legacy code and where to find the equivalent DCC documentation.

| Concept | Waves | DecentralChain |
|:--------|:------|:---------------|
| **Documentation** | [docs.waves.tech](https://docs.waves.tech/en/) | [docs.decentralchain.io](https://docs.decentralchain.io/en/master/) |
| **Account** | [waves/account](https://docs.waves.tech/en/blockchain/account/) | [dcc/account](https://docs.decentralchain.io/en/master/02_decentralchain/01_account.html) |
| **Token (Asset)** | [waves/token](https://docs.waves.tech/en/blockchain/token/) | [dcc/token](https://docs.decentralchain.io/en/master/02_decentralchain/02_token%28asset%29.html) |
| **Transaction** | [waves/transaction](https://docs.waves.tech/en/blockchain/transaction/) | [dcc/transaction](https://docs.decentralchain.io/en/master/02_decentralchain/03_transaction.html) |
| **Block** | [waves/block](https://docs.waves.tech/en/blockchain/block/) | [dcc/block](https://docs.decentralchain.io/en/master/02_decentralchain/04_block.html) |
| **Node** | [waves/node](https://docs.waves.tech/en/blockchain/node/) | [dcc/node](https://docs.decentralchain.io/en/master/02_decentralchain/05_node.html) |
| **Order (DEX)** | [waves/order](https://docs.waves.tech/en/blockchain/order/) | [dcc/order](https://docs.decentralchain.io/en/master/02_decentralchain/06_order.html) |
| **Oracle** | [waves/oracle](https://docs.waves.tech/en/blockchain/oracle/) | [dcc/oracle](https://docs.decentralchain.io/en/master/02_decentralchain/07_oracle.html) |
| **Networks** | [waves/networks](https://docs.waves.tech/en/blockchain/blockchain-network/) | [dcc/networks](https://docs.decentralchain.io/en/master/02_decentralchain/08_mainnet-testnet-stagenet.html) |
| **Protocol** | [waves/protocol](https://docs.waves.tech/en/blockchain/waves-protocol/) | [dcc/protocol](https://docs.decentralchain.io/en/master/02_decentralchain/09_protocol.html) |
| **Binary Format** | [waves/binary-format](https://docs.waves.tech/en/blockchain/binary-format/) | [dcc/binary-format](https://docs.decentralchain.io/en/master/02_decentralchain/10_binary-format.html) |
| **Ride Language** | [waves/ride](https://docs.waves.tech/en/ride/) | [dcc/ride](https://docs.decentralchain.io/en/master/03_ride-language/index.html) |
| **Building Apps** | [waves/building-apps](https://docs.waves.tech/en/building-apps/) | *Coming soon on DCC docs* |
| **Native Token** | WAVES | DecentralCoin (DCC) |
| **Consensus** | LPoS (Leased Proof of Stake) | LPoS (identical) |
| **M5 Protocol** | Waves-NG | DecentralChain-M5 (identical mechanics) |

### SDK Package Mapping — `@waves/*` → `@decentralchain/*`

Every `@waves/*` npm package has a corresponding `@decentralchain/*` package. All 19 packages below are **published and live on npm** with the `@next` tag.

| Waves Package | DecentralChain Package | Version | Purpose |
|:-------------|:----------------------|:--------|:--------|
| `@waves/bignumber` | `@decentralchain/bignumber` | 1.1.1 | Arbitrary precision arithmetic |
| `@waves/ts-lib-crypto` | `@decentralchain/ts-lib-crypto` | 2.0.0 | Cryptographic primitives (Curve25519, Blake2b, Keccak) |
| `@waves/marshall` | `@decentralchain/marshall` | 1.0.0 | Binary serialization/deserialization |
| `@waves/ts-types` | `@decentralchain/ts-types` | 2.0.0 | TypeScript type definitions for blockchain entities |
| `@waves/oracle-data` | `@decentralchain/oracle-data` | 1.0.0 | Oracle data encoding/decoding |
| `@waves/waves-browser-bus` | `@decentralchain/browser-bus` | 1.0.0 | Cross-window postMessage communication |
| `@waves/parse-json-bignumber` | `@decentralchain/parse-json-bignumber` | 2.0.0 | JSON parsing with BigNumber preservation |
| `@waves/ledger` | `@decentralchain/ledger` | 5.0.0 | Ledger hardware wallet integration |
| `@waves/protobuf-serialization` | `@decentralchain/protobuf-serialization` | 2.0.0 | Protobuf transaction serialization |
| `@waves/assets-pairs-order` | `@decentralchain/assets-pairs-order` | 5.0.1 | Canonical asset pair ordering for DEX |
| N/A (new) | `@decentralchain/cubensis-connect-types` | 1.0.0 | Wallet connector type definitions |
| `@waves/data-entities` | `@decentralchain/data-entities` | 3.0.0 | Domain entity models (Money, OrderPrice, etc.) |
| `@waves/money-like-to-node` | `@decentralchain/money-like-to-node` | 1.0.0 | Money-like to node format conversion |
| `@waves/waves-rest` | `@decentralchain/node-api-js` | 2.0.0 | Node REST API client |
| `@waves/data-service-client-js` | `@decentralchain/data-service-client-js` | 4.2.0 | Data service API client |
| `@waves/waves-transactions` | `@decentralchain/transactions` | 5.0.0 | Transaction building, signing, broadcasting |
| `@waves/signature-adapter` | `@decentralchain/signature-adapter` | 7.0.0 | Universal signature adapter |
| `@waves/signer` | `@decentralchain/signer` | 2.0.0 | Signer interface for transaction signing |
| N/A (new) | `@decentralchain/cubensis-connect-provider` | 1.0.0 | Cubensis Connect wallet provider |

### Network & API Endpoints

#### DecentralChain (Target)

| Service | Mainnet | Testnet |
|:--------|:--------|:--------|
| **Node API** | `https://mainnet-node.decentralchain.io` | `https://testnet-node.decentralchain.io` |
| **Data Service** | `https://data-service.decentralchain.io` | TBA |
| **DEX (Exchange)** | [decentral.exchange](https://decentral.exchange/) | TBA |
| **Matcher API** | `https://mainnet-matcher.decentralchain.io/api-docs/index.html` | `https://matcher.decentralchain.io/api-docs/index.html` |
| **Block Explorer** | [decentralscan.com](https://decentralscan.com/) (Mainnet) | [decentralscan.com](https://decentralscan.com/) (switch to Testnet) |
| **Explorer Source** | [github.com/Decentral-America/explorer](https://github.com/Decentral-America/explorer) | (same repo) |
| **Faucet (Testnet)** | — | TBA |

#### Waves (Upstream/Legacy)

| Service | URL |
|:--------|:----|
| **Documentation** | [docs.waves.tech](https://docs.waves.tech/en/) |
| **Node API** | `https://nodes.wavesnodes.com` (public pool) |
| **Data Service API** | [docs.waves.tech/data-service](https://docs.waves.tech/en/building-apps/waves-api-and-sdk/waves-data-service-api) |
| **DEX (Exchange)** | [wx.network](https://wx.network/) |
| **Block Explorer** | [wavesexplorer.com](https://wavesexplorer.com/) |
| **Ride IDE** | [waves-ide.com](https://waves-ide.com/) |
| **Developer Portal** | [dev.waves.tech](https://dev.waves.tech/) |
| **Lessons** | [dev.waves.tech/edu/lessons](https://dev.waves.tech/edu/lessons) |
| **GitHub** | [github.com/wavesplatform](https://github.com/wavesplatform) |

### GitHub Organizations

| Ecosystem | GitHub Org | URL |
|:----------|:-----------|:----|
| **DecentralChain** | `Decentral-America` | [github.com/Decentral-America](https://github.com/Decentral-America) |
| **Waves** (upstream) | `wavesplatform` | [github.com/wavesplatform](https://github.com/wavesplatform) |
| **Keeper Wallet** | `Keeper-Wallet` | [github.com/Keeper-Wallet](https://github.com/Keeper-Wallet) |

### Project Management

| System | URL |
|:-------|:----|
| **Jira Board** | [decentralchain.atlassian.net/jira/software/projects/DCC/boards/1](https://decentralchain.atlassian.net/jira/software/projects/DCC/boards/1) |
| **GitHub Org** | [github.com/Decentral-America](https://github.com/Decentral-America) |
| **npm Org** | [npmjs.com/org/decentralchain](https://www.npmjs.com/org/decentralchain) |
| **Documentation** | [docs.decentralchain.io](https://docs.decentralchain.io/en/master/) |
| **Block Explorer** | [decentralscan.com](https://decentralscan.com/) |
| **Explorer Source** | [github.com/Decentral-America/explorer](https://github.com/Decentral-America/explorer) |
| **DEX** | [decentral.exchange](https://decentral.exchange/) |

### Social & Community

| Platform | URL |
|:---------|:----|
| **Instagram** | [instagram.com/decentralchain](https://www.instagram.com/decentralchain/) |
| **LinkedIn** | [linkedin.com/company/decentralchain](https://cr.linkedin.com/company/decentralchain/) |
| **YouTube** | [youtube.com/@decentralchain](https://www.youtube.com/@decentralchain) |
| **GitHub Org** | [github.com/Decentral-America](https://github.com/Decentral-America) |
| **Block Explorer** | [decentralscan.com](https://decentralscan.com/) |
| **Email** | [info@decentralamerica.com](mailto:info@decentralamerica.com) |

### npm Organizations

| Ecosystem | npm Org | URL |
|:----------|:--------|:----|
| **DecentralChain** | `@decentralchain` | [npmjs.com/org/decentralchain](https://www.npmjs.com/org/decentralchain) |
| **Waves** (upstream) | `@waves` | [npmjs.com/org/waves](https://www.npmjs.com/org/waves) |

### Ride Language — Quick Reference

Ride is the smart contract language used on **both** Waves and DecentralChain. It is:

- **Non-Turing-complete** — no loops, no recursion (iteration via `FOLD<N>`)
- **Functional** — expression-based, no mutations
- **Statically typed** — types declared and checked at compile time
- **Lazy** — expressions evaluated only when needed

| Topic | DecentralChain Docs | Waves Docs |
|:------|:-------------------|:-----------|
| Syntax Basics | [dcc/ride/syntax](https://docs.decentralchain.io/en/master/03_ride-language/01_syntax-basics.html) | [waves/ride/getting-started](https://docs.waves.tech/en/ride/getting-started) |
| Data Types | [dcc/ride/data-types](https://docs.decentralchain.io/en/master/03_ride-language/02_data-types.html) | [waves/ride/data-types](https://docs.waves.tech/en/ride/data-types/) |
| Functions | [dcc/ride/functions](https://docs.decentralchain.io/en/master/03_ride-language/03_functions.html) | [waves/ride/functions](https://docs.waves.tech/en/ride/functions/) |
| Script Types | [dcc/ride/scripts](https://docs.decentralchain.io/en/master/03_ride-language/04_script-types.html) | [waves/ride/script](https://docs.waves.tech/en/ride/script/) |
| Structures | [dcc/ride/structures](https://docs.decentralchain.io/en/master/03_ride-language/05_structures.html) | [waves/ride/structures](https://docs.waves.tech/en/ride/structures/) |
| FOLD iterations | [dcc/ride/fold](https://docs.decentralchain.io/en/master/03_ride-language/06_iterations-with-fold.html) | [waves/ride/fold](https://docs.waves.tech/en/ride/functions/built-in-functions/) |
| dApp-to-App | [dcc/ride/dapp-invocation](https://docs.decentralchain.io/en/master/03_ride-language/07_dapp-to-app-invocation.html) | [waves/ride/dapp-to-dapp](https://docs.waves.tech/en/ride/advanced/dapp-to-app/) |

### DCC Ecosystem — Unique Features

These features exist **only** in DecentralChain and have no Waves equivalent:

| Feature | Description |
|:--------|:------------|
| **Inter-Chain Gateway** | Decentralized bridge for cross-chain asset transfers and data sharing |
| **Proof of Incentivized Sustainability** | Carbon credit generation per transaction; eco-friendly node hosting rewards |
| **Carbon Sequestration** | Tokenized carbon credits via Costa Rica's FONAFIFO program |
| **Native Swap** | AMM-powered on-chain token swap (constant product formula) |
| **CR Coin** | Social currency for Costa Rica built on DCC |
| **Cubensis Connect** | Wallet connector interface (replaces Keeper Wallet integration pattern) |

### Summary — What You Need to Know Before Migrating

1. **Protocol is identical** — Waves and DCC share the same transaction types, binary formats, cryptographic primitives, and Ride language. Migration is primarily a **rebranding + modernization** exercise.
2. **Every `@waves/*` import becomes `@decentralchain/*`** — use the package mapping table above.
3. **Network endpoints change** — `nodes.wavesnodes.com` becomes `mainnet-node.decentralchain.io`.
4. **String constants change** — "WAVES" becomes "DCC", "waves" in URLs becomes "decentralchain".
5. **The SDK must work with both networks** — many packages accept a `chainId` or `nodeUrl` parameter. The protocol is the same; only the network identity differs.
6. **Tooling is fully modernized** — ESM-only, Node 24+, TypeScript 5.9+, Vitest, tsup, Biome. No CJS, no Webpack, no Jest, no Yarn, no ESLint, no Prettier.

---

## Documentation & Traceability — Jira + GitHub Integration

Every change to the DecentralChain SDK **must** be documented in two places and linked between them:

### Why Both?

| System | Role | What Lives There |
|:-------|:-----|:-----------------|
| **Jira** | Project management & planning | Epics, stories, tasks, subtasks, acceptance criteria, sprint tracking, release notes |
| **GitHub** | Code, reviews, CI/CD | Commits, PRs, branches, issues, actions, releases |

Jira is the **source of truth for what needs to happen**. GitHub is the **source of truth for what actually happened**. The two are linked via **ticket IDs in commit messages and branch names**, creating a full audit trail from business requirement → code change → test → release.

### Jira Workflow

1. **Every piece of work has a Jira ticket** — no ticket, no work. This includes:
   - New features (`Story`)
   - Bug fixes (`Bug`)
   - Tech debt / modernization (`Task`)
   - Dependency upgrades (`Task`)
   - Documentation updates (`Task`)
   - CI/CD changes (`Task`)

2. **Ticket IDs follow the pattern `DCC-###`** (e.g., `DCC-15`, `DCC-42`, `DCC-128`).

3. **Before starting work:**
   - Move the ticket to `In Progress`
   - Create a branch named `<type>/DCC-###-short-description` (e.g., `feat/DCC-15-proto-reserved-directive`)

4. **During work:**
   - Reference the ticket in every commit (see commit convention below)
   - Add implementation notes to the Jira ticket as comments
   - Update the ticket with any scope changes or blockers

5. **After work:**
   - Move the ticket to `In Review` when the PR is opened
   - Link the PR URL in the Jira ticket
   - Move to `Done` only after merge + verification
   - Add a summary comment with: files changed, key decisions, test results

### The Universal Format

One format governs **every** named artifact in the project. The Jira key (`DCC-###`) is the universal link — it appears in the branch name, commit scope, PR title, and GitHub Issue title so everything traces back to one source of truth.

```
<type>(DCC-###): <lowercase description in imperative mood, no period>
```

| Surface | Format | Example |
|:--------|:-------|:--------|
| **Branch** | `<type>/DCC-###-short-description` | `feat/DCC-15-proto-reserved-directive` |
| **Commit** | `<type>(DCC-###): <description>` | `feat(DCC-15): add reserved directive to transaction proto` |
| **PR title** | `<type>(DCC-###): <description>` | `feat(DCC-15): add reserved directive to transaction proto` |
| **GH Issue title** | `<type>(DCC-###): <description>` | `refactor(DCC-28): extract shared listing query module` |
| **Merge commit** | _(auto from PR title via squash)_ | `feat(DCC-15): add reserved directive to transaction proto` |

> **Key principle:** The same `type`, `DCC-###`, and `description` appear on every surface. If you see `DCC-42` anywhere — branch, commit, PR, issue — you can find every related artifact instantly.

### Allowed Types

| Type | When to Use |
|:-----|:------------|
| `feat` | A new feature or capability |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, whitespace, semicolons — no logic change |
| `refactor` | Code restructuring — no feature or fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system or external dependencies (tsup, tsconfig, etc.) |
| `ci` | CI/CD configuration (GitHub Actions, workflows) |
| `chore` | Maintenance tasks (dependency bumps, config tweaks) |
| `revert` | Reverting a previous commit |

### Validation Rules (Enforced)

| Rule | Correct | Wrong |
|:-----|:--------|:------|
| Type is **lowercase** | `feat(DCC-15):` | ~~`Feat(DCC-15):`~~ |
| Scope is **uppercase** Jira key + number | `fix(DCC-42):` | ~~`fix(dcc-42):`~~ |
| Description starts **lowercase** | `add reserved directive` | ~~`Add reserved directive`~~ |
| Description has **no period** at end | `fix field numbering` | ~~`fix field numbering.`~~ |
| Description uses **imperative mood** | `add`, `fix`, `remove` | ~~`added`, `fixed`, `removed`~~ |
| Branch uses **kebab-case** after ticket | `feat/DCC-15-proto-reserved` | ~~`feat/DCC-15_proto_reserved`~~ |
| Scope is **required** when a Jira ticket exists | `chore(DCC-7): upgrade protobufjs` | ~~`chore: upgrade protobufjs`~~ (if DCC-7 exists) |
| Scope is **omitted** when no Jira ticket applies | `docs: update README` | ~~`docs(): update README`~~ |

### Branch Naming Convention

```
<type>/DCC-###-short-description
```

- `short-description` is **kebab-case**, 2–5 words, descriptive enough to identify the work
- Must match the commit/PR type — a `feat/` branch produces `feat(DCC-###):` commits

**Examples:**
```
feat/DCC-15-proto-reserved-directive
fix/DCC-42-block-header-field-numbering
chore/DCC-7-upgrade-protobufjs
refactor/DCC-88-extract-crypto-utils
test/DCC-15-roundtrip-commit-generation
docs/DCC-99-update-readme
ci/DCC-100-node24-matrix
```

### Commit Message Convention

All commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/).

**Format:**
```
<type>(DCC-###): <description>

[optional body]

[optional footer(s)]
```

**Examples:**
```
feat(DCC-15): add reserved directive to transaction proto
fix(DCC-42): correct field numbering in block header
chore(DCC-7): upgrade protobufjs to v8
test(DCC-15): add roundtrip tests for CommitToGeneration
refactor(DCC-88): extract crypto utils into shared module
perf(DCC-55): lazy-load protobuf definitions
build(DCC-12): switch from webpack to tsup
ci(DCC-100): add Node 24 to test matrix
docs: update README
style: fix formatting in transaction builder
```

**Body** (optional): explain **why**, not what — the diff shows the what.

**Footer** (optional): `BREAKING CHANGE:` for breaking changes, `Refs: DCC-###` for additional ticket references.

**Breaking change example:**
```
feat(DCC-18)!: remove CJS output from marshall package

ESM-only output aligns with the SDK-wide Node 24+ requirement.
Consumers using require() must update to import syntax.

BREAKING CHANGE: CJS build output removed. Package is now ESM-only.
Refs: DCC-1, DCC-7
```

### PR (Pull Request) Convention

- **Title**: Same format as commit — `<type>(DCC-###): <description>`
- **Merge strategy**: Squash merge — the PR title becomes the merge commit message, so the title **must** be clean
- **Description**: Must include:
  - Link to Jira ticket
  - Summary of changes
  - Testing performed
  - Breaking changes (if any)
- **Labels**: Match the commit type (`feature`, `bugfix`, `chore`, etc.)
- **Reviewers**: At least 1 required review before merge

### GitHub Issue Title Convention

- **Title**: Same format — `<type>(DCC-###): <description>`
- If the GH issue was created _before_ the Jira ticket, update the title once the Jira ticket is assigned
- If a GH issue is informational and has no Jira ticket, omit the scope: `docs: clarify API authentication`

**Examples:**
```
refactor(DCC-28): extract shared listing query module
bug(DCC-42): block header field numbering incorrect on testnet
feat(DCC-15): add reserved directive support to proto serialization
```

### Release & Changelog

Conventional commits enable **automated changelog generation**:
- `feat` → appears under **Features** in CHANGELOG.md
- `fix` → appears under **Bug Fixes**
- `BREAKING CHANGE` → appears under **BREAKING CHANGES** with migration guidance
- All other types are excluded from user-facing changelog but preserved in git history

Every package release must:
1. Update `CHANGELOG.md` with grouped conventional commit entries
2. Tag with semver: `vX.Y.Z`
3. Create a GitHub Release with the changelog excerpt
4. Update the Jira ticket(s) with the release version
5. Close the Jira epic/story if all subtasks are done

### Traceability Chain

The complete audit trail for any change must be:

```
Jira Ticket (DCC-###)
  → GitHub Issue (type(DCC-###): description)          ← optional, for public tracking
  → Branch (type/DCC-###-short-description)
    → Commits (type(DCC-###): description)
      → PR (type(DCC-###): description)
        → Merge commit (squash — auto from PR title)
          → CHANGELOG.md entry
            → GitHub Release (vX.Y.Z)
              → npm publish (@decentralchain/package@X.Y.Z)
                → Jira ticket closed with release version
```

Every artifact in the chain shares the same `DCC-###` key. Searching for `DCC-42` in Jira, GitHub Issues, branches, commits, PR titles, and changelogs returns the **complete history** of that work item.

**This is non-negotiable for financial infrastructure.** Every line of code must be traceable from business requirement to production deployment.

---

## --- BEGIN PROMPT ---

You are performing a complete migration and modernization of a package for the DecentralChain SDK. This is **financial infrastructure** — the software moves money, generates keys, signs transactions, and manages digital assets for real users. Every decision you make must reflect the gravity of that responsibility.

You must apply EVERY specification below exactly. Do not skip steps, do not invent protocol behavior, do not modify source semantics. If critical protocol details are missing, **ASK before proceeding** — but for all tooling, config, and quality decisions, execute without hesitation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## [VARIABLES] — Fill These In Per Project

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```yaml
# ── Identity ──────────────────────────────────────────────────────
PACKAGE_NAME:       '@decentralchain/XXXXX'   # e.g. "@decentralchain/bignumber"
PACKAGE_VERSION:    'X.Y.Z'                   # semver for first modernized release
DESCRIPTION:        '...'                     # one-line npm description (compelling, 80 chars max)
KEYWORDS:                                     # npm keywords array (8-15 keywords)
  - decentralchain
  - dcc
  - blockchain
  - ...

# ── Repository ────────────────────────────────────────────────────
REPO_ORG:           'Decentral-America'        # GitHub org
REPO_NAME:          'XXXXX'                    # GitHub repo slug
AUTHOR:             'DecentralChain'           # npm author field
LOCAL_FOLDER:       'DCC-XX'                   # local workspace folder name

# ── Migration Source ──────────────────────────────────────────────
# What are we migrating FROM? This controls the depth of cleanup needed.
MIGRATION_TYPE:     'waves'                    # waves | decentralchain-legacy | greenfield
  # waves              → full @waves/* elimination + rebrand + modernize
  # decentralchain-legacy → already @decentralchain but outdated tooling
  # greenfield         → new package from scratch

PREVIOUS_SCOPE:     '@waves'                   # '@waves' | '@decentralchain' | 'unscoped' | 'N/A'
PREVIOUS_VERSION:   'X.Y.Z'                    # last published version (or 'N/A')
PREVIOUS_BUILD_TOOL: 'webpack'                 # webpack | rollup | tsc | vite | none
PREVIOUS_TEST_RUNNER: 'jest'                   # jest | mocha | tape | none
PREVIOUS_PM:        'yarn'                     # yarn | npm | pnpm

# ── Build Configuration ──────────────────────────────────────────
# ESM-only is the DEFAULT and REQUIRED for all new DecentralChain packages.
# CJS output is ONLY allowed if you have a documented, specific legacy requirement.
# IIFE is for packages that need a browser <script> tag global.
FORMATS:            ['esm']                    # ['esm'] (default) | ['esm', 'iife']
UMD_GLOBAL_NAME:    ''                         # only if IIFE included, e.g. 'DCCCrypto'

# ── Node.js ───────────────────────────────────────────────────────
MIN_NODE:           '24'                       # minimum supported Node.js version
RECOMMENDED_NODE:   '24'                       # for .node-version / .nvmrc
NODE_MATRIX:        [24]                       # CI test matrix (active LTS only; add 26 when it ships)

# ── Quality ───────────────────────────────────────────────────────
COVERAGE_THRESHOLDS:
  branches:   90                               # For newly migrated code, start at 70 → ratchet to 90
  functions:  90
  lines:      90
  statements: 90

# ── Size Budget ───────────────────────────────────────────────────
SIZE_LIMIT_PATH:    './dist/index.mjs'         # path to measure
SIZE_LIMIT:         '10 kB'                    # max gzipped size
SIZE_LIMIT_IMPORT:  '{ MainExport }'           # named import to tree-shake measure

# ── Feature Flags ─────────────────────────────────────────────────
HAS_BROWSER_BUNDLE: false                      # true → enables IIFE/UMD build in tsup
HAS_VENDOR_CODE:    false                      # true → relaxed Biome rules for src/libs/**
HAS_CRYPTO:         false                      # true → crypto-specific audit checks
HAS_NETWORK:        false                      # true → network-specific audit checks
HAS_BROWSER_API:    false                      # true → postMessage/localStorage audit
HAS_USER_INPUT:     false                      # true → input validation audit
HAS_MULTI_ENTRY:    false                      # true → multiple entry points in tsup
NEEDS_TYPES_NODE:   false                      # true → adds @types/node to devDeps

# ── Dependencies ──────────────────────────────────────────────────
PRODUCTION_DEPS: []                            # pinned runtime deps, e.g. ['bignumber.js: ^10.0.2']
DEV_ONLY_DEPS:   []                            # deps to MOVE from runtime to dev
PEER_DEPS:       []                            # peer dependencies, e.g. ['@decentralchain/signer: >=2.0.0']
DCC_INTERNAL_DEPS: []                          # @decentralchain/* deps with pinned versions
  # e.g. ['@decentralchain/ts-types: 2.0.0', '@decentralchain/bignumber: 1.1.1']

# ── Publish Configuration ────────────────────────────────────────
PUBLISH_TAG:        'next'                     # npm dist-tag: 'next' (pre-release) | 'latest' (stable)
NPM_SCOPE:          '@decentralchain'          # npm scope
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## VERSION RESOLUTION (CRITICAL — Read Before Executing)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This prompt is **version-agnostic by design**. All dependency versions, GitHub
Actions tags, and tool versions use `{{LATEST}}` placeholders.

**Before generating any file**, resolve every `{{LATEST}}` to the **current latest
stable version** at execution time:

| Resource | How to Resolve | Baseline (Mar 2026) |
|----------|---------------|-------------------|
| npm packages | `npm info <package> version` | — |
| TypeScript | `npm info typescript version` | ~5.9.3 |
| Biome | `npm info @biomejs/biome version` | ~2.x (2.4.2 as of Mar 2026) |
| Vitest | `npm info vitest version` | ~4.0.18 |
| tsup | `npm info tsup version` | ~8.5.1 |
| Lefthook | `npm info @evilmartians/lefthook version` | ~1.x (1.11.x as of Mar 2026) |
| `packageManager` field | `npm --version` | ~11.11.0 |
| `@types/node` | Pin to major matching `MIN_NODE` | @types/node@24 → `^24.x.x` |
| `actions/checkout` | Check GitHub releases | ~v6 |
| `actions/setup-node` | Check GitHub releases | ~v6 |
| `actions/upload-artifact` | Check GitHub releases | ~v7 |

**Rules:**
- If current version is **newer** than baseline → use it (expected over time).
- If current version is **older** than baseline → something is wrong, investigate.
- `@types/node` must match `MIN_NODE` major, NOT absolute latest.
- GitHub Actions: use latest **major** tag (e.g. `v6` not `v6.2.1`).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## ARCHITECTURAL DECISIONS (Final — Do Not Deviate)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Module system** | ESM-only (`"type": "module"`) | Industry standard 2026+. No CJS unless explicitly required. |
| **Package manager** | npm (latest stable) | Universal, no extra tooling. `packageManager` field enforced. |
| **Build tool** | tsup | ESM-only default. Handles DTS generation, tree-shaking, minification. |
| **Test runner** | Vitest | ESM-native, fast, Jest-compatible API, V8 coverage. |
| **Coverage** | `@vitest/coverage-v8` | V8-native, fast, threshold enforcement built in. |
| **Linter + Formatter** | Biome (latest stable) | Single Rust-native tool replaces ESLint + Prettier. 25-100x faster. `biome.json` config. |
| **Git hooks** | Lefthook | Single Go binary replaces Husky + lint-staged. Parallel execution. `lefthook.yml` config. |
| **Package validation** | publint + attw | Ensures correct exports for all consumers. |
| **Bundle budget** | size-limit | Enforced per entry point. Prevents bundle bloat. |
| **CI** | GitHub Actions | Matrix across Node versions. Full quality pipeline. |
| **Dependency updates** | Dependabot | Weekly, grouped by dev/prod. GitHub Actions updates included. |
| **Dead code detection** | knip | Global install, not project dep. Run after modernization. |
| **Changelog** | Keep a Changelog format | Manual entries with semantic versioning. |
| **Target** | ES2024 | Modern JS features. No polyfills. |
| **TypeScript** | Strict mode, all flags | Zero type errors, zero `any` leaks. |
| **Node.js** | 24+ minimum, [24] CI matrix | Active LTS only; add 26 when it ships. |

### What We Do NOT Use

| Rejected | Why |
|----------|-----|
| CJS output | Dead format. ESM-only unless documented legacy need. |
| Yarn / pnpm | npm is universal. One package manager for all repos. |
| Jest | Replaced by Vitest across all 19 packages. |
| Webpack | Replaced by tsup across all 19 packages. |
| Rollup (for TS) | tsup wraps esbuild. Only use Rollup for pure JS IIFE bundles. |
| ESLint | Replaced by Biome. Single tool handles linting + formatting. |
| Prettier | Replaced by Biome. No separate formatter needed. |
| `eslint-config-prettier` | Not needed — Biome has no formatter/linter conflict by design. |
| `typescript-eslint` | Not needed — Biome has native TypeScript support. |
| `.eslintrc` | Dead format. Biome uses `biome.json`. |
| Babel | TypeScript handles all transpilation via tsup/esbuild. |
| `.npmignore` | Use `"files"` field in package.json instead. |
| `tslint` | Dead project. Biome replaces it. |
| Travis CI | GitHub Actions replaces it. |
| Mocha / Tape | Vitest replaces all legacy test runners. |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## BRANDING & INDEPENDENCE (CRITICAL — For `@waves` Migrations)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If `MIGRATION_TYPE` is `waves`, replace ALL Waves-specific values:

| Category | Waves → DecentralChain |
|----------|----------------------|
| Package scope | `@waves/*` → `@decentralchain/*` |
| Token name | `WAVES` → `DCC` |
| API endpoints | `nodes.wavesnodes.com` → `nodes.decentralchain.io` |
| Network byte / chain ID | Waves chain IDs → DecentralChain equivalents |
| Address prefixes | Waves format → DecentralChain format |
| Explorer links | `wavesexplorer.com` → DecentralChain explorer |
| Default nodes | Waves nodes → `https://nodes.decentralchain.io` |
| Fee structures | Waves fees → DecentralChain rules |
| Author/org | `Wavesplatform` / `wavesplatform` → `DecentralChain` / `Decentral-America` |
| README badges | Waves URLs → DecentralChain URLs |

**If DecentralChain equivalents are unknown → ASK. Do NOT invent protocol behavior.**

The final package MUST:

- NOT require Waves nodes
- NOT depend on Waves APIs or SDKs
- NOT import `@waves/*` packages (replace with `@decentralchain/*` equivalents)
- NOT reference Waves branding anywhere (code, comments, docs, config)
- Function as a standalone DecentralChain library

### Acceptable Exceptions (Document Each One)

| Context | Why It's Acceptable |
|---------|-------------------|
| `.proto` files: `package waves;` | Wire-format protocol identifier, cannot change without breaking serialization |
| Ledger firmware: `'WAVES'` | Hardware device protocol constant, burned into firmware |
| CHANGELOG.md: "migrated from Waves" | Historical record, important for traceability |
| KNOWN_ISSUES.md: legacy references | Documenting migration status |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 1 — CLEAN SLATE (Delete Legacy Files)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Delete ALL of these if they exist. No exceptions.

```
yarn.lock
pnpm-lock.yaml
.yarnrc
.yarnrc.yml
.pnpmfile.cjs
.babelrc
.babelrc.js
babel.config.js
babel.config.json
.travis.yml
.npmignore
jest.config.js
jest.config.ts
jest.config.json
jest.setup.ts
jest.setup.js
tslint.json
webpack.config.js
webpack.config.ts
webpack.config.mjs
rollup.config.js            # KEEP for pure-JS IIFE projects only
rollup.config.mjs
tsconfig.build.json          # consolidate into tsconfig.json
.eslintrc
.eslintrc.js
.eslintrc.json
.eslintrc.yml
.eslintrc.yaml
.eslintrc.cjs
.eslintignore
.prettierrc                  # replaced by biome.json
.prettierrc.js
.prettierrc.yml
.prettierrc.yaml
.prettierrc.cjs
.prettierrc.json             # replaced by biome.json
.prettierignore              # replaced by biome.json files.ignore
eslint.config.mjs            # replaced by biome.json
eslint.config.js             # replaced by biome.json
.nycrc
.nycrc.json
.istanbul.yml
karma.conf.js
Gruntfile.js
Gulpfile.js
Makefile                     # KEEP if it contains non-JS build steps (protobuf, etc.)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 2 — CONFIGURATION FILES

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create or replace every file below. These are the **exact** standards used across
all 19 published `@decentralchain` packages.

### `.node-version`

```
{{RECOMMENDED_NODE}}
```

### `.npmrc`

```
engine-strict=true
save-exact=true
package-lock=true
```

### `.editorconfig`

```editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false

[*.{json,yml,yaml}]
indent_size = 2
```

### `biome.json`

Biome replaces both ESLint and Prettier with a single config file and a single
Rust-native binary (25-100x faster). All formatting and linting rules are defined here.

```jsonc
{
  "$schema": "https://biomejs.dev/schemas/latest/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignore": [
      "dist", "coverage", "node_modules",
      "*.d.ts", "*.d.cts", "*.map",
      "package-lock.json"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedFunctionParameters": "error",
        "noUnusedImports": "error"
      },
      "suspicious": {
        "noExplicitAny": "warn",
        "noDoubleEquals": "error",
        "noConsole": "warn"
      },
      "style": {
        "useConst": "error",
        "noVar": "error",
        "useImportType": "error"
      },
      "security": {
        "noGlobalEval": "error"
      }
    }
  },
  "overrides": [
    {
      "include": ["test/**"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off",
            "noConsole": "off"
          }
        }
      }
    }
  ]
}
```

> **Overrides:** Add project-specific overrides as needed (e.g., vendor code in `src/libs/`).
> The `overrides` array works like ESLint's per-file config blocks.

> **Migration from ESLint + Prettier:** Run `npx @biomejs/biome migrate eslint --write --include-inspired`
> and `npx @biomejs/biome migrate prettier --write` to auto-generate initial config from
> existing ESLint/Prettier files, then delete the old config files.

### `.gitignore`

```gitignore
# IDE
.idea
.vscode
*.swp
*.swo

# Build output
dist
coverage
*.tsbuildinfo

# Dependencies
node_modules

# OS
.DS_Store
Thumbs.db

# Misc
.size-snapshot.json
.rpt2_cache
*.local
*.tgz
```

### `lefthook.yml`

```yaml
pre-commit:
  parallel: true
  commands:
    lint:
      glob: "*.{ts,tsx,js,jsx,mjs,cjs,json,css}"
      run: npx @biomejs/biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true
    typecheck:
      run: npm run typecheck
```

### `package.json`

```jsonc
{
  "name": "{{PACKAGE_NAME}}",
  "version": "{{PACKAGE_VERSION}}",
  "description": "{{DESCRIPTION}}",
  "type": "module",
  "packageManager": "npm@{{LATEST_NPM}}",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs"
      // Add "default": "./dist/index.umd.min.js" ONLY if HAS_BROWSER_BUNDLE
    }
    // Add additional entry points if HAS_MULTI_ENTRY
  },
  "module": "./dist/index.mjs",
  "types": "./dist/index.d.ts",
  "sideEffects": false,
  "files": ["dist", "LICENSE", "README.md"],
  "engines": { "node": ">={{MIN_NODE}}" },
  "publishConfig": { "access": "public", "provenance": true },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/{{REPO_ORG}}/{{REPO_NAME}}.git"
  },
  "funding": {
    "type": "github",
    "url": "https://github.com/sponsors/{{REPO_ORG}}"
  },
  "homepage": "https://github.com/{{REPO_ORG}}/{{REPO_NAME}}#readme",
  "bugs": { "url": "https://github.com/{{REPO_ORG}}/{{REPO_NAME}}/issues" },
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "typecheck": "tsc --noEmit",
    "lint": "biome check --write .",
    "lint:check": "biome check .",
    "format": "biome format --write .",
    "format:check": "biome format .",
    "check:publint": "publint",
    "check:exports": "attw --pack . --profile esm-only",
    "check:size": "size-limit",
    "validate": "npm run lint:check && npm run typecheck && npm run test && npm run build && npm run check:publint && npm run check:exports && npm run check:size",
    "bulletproof": "npm run lint && npm run typecheck && npm run test",
    "bulletproof:check": "npm run lint:check && npm run typecheck && npm run test",
    "prepare": "lefthook install",
    "prepack": "npm run build",
    "postversion": "npm publish",
    "postpublish": "git push"
  },
  "size-limit": [
    {
      "path": "{{SIZE_LIMIT_PATH}}",
      "limit": "{{SIZE_LIMIT}}"
    }
  ],
  "keywords": ["{{...KEYWORDS}}"],
  "author": "{{AUTHOR}}",
  "license": "MIT",
  "dependencies": {
    // {{PRODUCTION_DEPS}} — pinned with save-exact
    // {{DCC_INTERNAL_DEPS}} — pinned to exact published versions
  },
  "peerDependencies": {
    // {{PEER_DEPS}} — semver ranges
  },
  "devDependencies": {
    // ⚠️ RESOLVE ALL to latest stable at execution time.
    // Run `npm info <package> version` for each.
    "@arethetypeswrong/cli": "{{LATEST}}",          // ~0.18.2 as of Mar 2026
    "@biomejs/biome":        "{{LATEST}}",           // ~2.4.2 as of Mar 2026 (replaces eslint + prettier)
    "@size-limit/preset-small-lib": "{{LATEST}}",    // ~12.0.0 as of Mar 2026
    "@vitest/coverage-v8":   "{{LATEST}}",           // ~4.0.18 as of Mar 2026
    "@evilmartians/lefthook": "{{LATEST}}",          // ~1.11.x as of Mar 2026 (replaces husky + lint-staged)
    "publint":               "{{LATEST}}",           // ~0.3.18 as of Mar 2026
    "size-limit":            "{{LATEST}}",           // ~12.0.0 as of Mar 2026
    "tsup":                  "{{LATEST}}",           // ~8.5.1  as of Mar 2026
    "typescript":            "{{LATEST}}",           // ~5.9.3  as of Mar 2026
    "vitest":                "{{LATEST}}"            // ~4.0.18 as of Mar 2026
    // If NEEDS_TYPES_NODE: "@types/node": "^{{MIN_NODE}}.x.x"
    //   ⚠️ Pin @types/node to MIN_NODE major — NOT absolute latest
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": false,
    "forceConsistentCasingInFileNames": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "exclude": ["node_modules", "dist"],
  "include": ["src/**/*.ts"]
}
```

> **Notes on strictness flags:**
> - `verbatimModuleSyntax: true` — enforces `import type`. Set to `false` ONLY if the
>   codebase has extensive legacy `import { Type }` patterns that would require massive refactoring.
>   Document the reason if set to `false`.
> - `exactOptionalPropertyTypes: false` — may conflict with protobuf types. Enable if possible.
> - `noPropertyAccessFromIndexSignature: false` — enable if the codebase is clean enough.
> - `noUnusedLocals` / `noUnusedParameters` — if upstream packages ship `.ts` source
>   (not `.d.ts`), these will flag errors inside `node_modules`. In that case, keep `false`
>   and enforce via Biome instead. Document the reason.

### `tsup.config.ts`

```typescript
import { defineConfig } from 'tsup';

export default defineConfig([
  // ── ESM (for Node / bundlers) ───────────────────────────────────
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'dist',
    splitting: false,
    treeshake: true,
    target: 'es2024',
    outExtension() {
      return { js: '.mjs' };
    },
  },
  // ── IIFE (browser global) — uncomment if HAS_BROWSER_BUNDLE ────
  // {
  //   entry: ['src/index.ts'],
  //   format: ['iife'],
  //   globalName: '{{UMD_GLOBAL_NAME}}',
  //   outDir: 'dist',
  //   minify: true,
  //   sourcemap: true,
  //   target: 'es2024',
  //   outExtension() {
  //     return { js: '.umd.min.js' };
  //   },
  // },
]);
```

> **Multi-entry**: If `HAS_MULTI_ENTRY`, add each entry to the `entry` array and
> add corresponding `exports` in package.json. See DCC-7 for a real example with
> `src/index.ts`, `src/bytes.ts`, `src/rsa.ts`.

### `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'],     // re-export barrel — exclude from coverage
      reporter: ['text', 'lcov', 'json-summary'],
      thresholds: {
        branches: {{COVERAGE_THRESHOLDS.branches}},
        functions: {{COVERAGE_THRESHOLDS.functions}},
        lines: {{COVERAGE_THRESHOLDS.lines}},
        statements: {{COVERAGE_THRESHOLDS.statements}},
      },
    },
    reporters: ['default'],
    typecheck: { enabled: true },
  },
});
```

> **No `eslint.config.mjs` needed.** Biome handles both linting and formatting via `biome.json` (see above).
> If migrating from an existing ESLint setup, run:
> ```bash
> npx @biomejs/biome migrate eslint --write --include-inspired
> npx @biomejs/biome migrate prettier --write
> ```
> Then delete `eslint.config.mjs`, `.prettierrc.json`, and `.prettierignore`.

### `knip.json`

```json
{
  "$schema": "https://unpkg.com/knip@latest/schema.json",
  "entry": ["src/index.ts"],
  "project": ["src/**/*.ts"],
  "ignore": ["dist/**"],
  "ignoreDependencies": []
}
```

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, master, develop]
  pull_request:
    branches: [main, master, develop]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    name: Quality Gate (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: {{NODE_MATRIX}}    # e.g. [24]
    steps:
      - uses: actions/checkout@{{LATEST_ACTIONS_CHECKOUT}}    # e.g. v6

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@{{LATEST_ACTIONS_SETUP_NODE}}    # e.g. v6
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint & format check
        run: npm run lint:check

      - name: Type check
        run: npm run typecheck

      - name: Test with coverage
        run: npm run test:coverage

      - name: Build
        run: npm run build

      - name: Validate package exports (publint)
        run: npm run check:publint

      - name: Validate type exports (attw)
        run: npm run check:exports

      - name: Check bundle size
        run: npm run check:size

      - name: Check package contents
        run: |
          npm pack --dry-run 2>&1 | tail -5
          echo "---"
          du -sh dist/

      - name: Upload coverage
        if: matrix.node-version == {{RECOMMENDED_NODE}}
        uses: actions/upload-artifact@{{LATEST_ACTIONS_UPLOAD_ARTIFACT}}    # e.g. v7
        with:
          name: coverage-report
          path: coverage/
          retention-days: 14

  release-dry-run:
    name: Release Dry Run
    runs-on: ubuntu-latest
    needs: quality
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    steps:
      - uses: actions/checkout@{{LATEST_ACTIONS_CHECKOUT}}
      - uses: actions/setup-node@{{LATEST_ACTIONS_SETUP_NODE}}
        with:
          node-version: {{RECOMMENDED_NODE}}
          cache: npm
      - run: npm ci
      - run: npm run build
      - run: npm pack --dry-run
```

### `.github/workflows/publish.yml`

```yaml
name: Publish to npm

on:
  workflow_dispatch:
    inputs:
      tag:
        description: 'npm dist-tag'
        required: true
        default: 'next'
        type: choice
        options:
          - next
          - latest

permissions:
  contents: read
  id-token: write    # required for npm provenance

jobs:
  publish:
    name: Publish
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@{{LATEST_ACTIONS_CHECKOUT}}
      - uses: actions/setup-node@{{LATEST_ACTIONS_SETUP_NODE}}
        with:
          node-version: {{RECOMMENDED_NODE}}
          cache: npm
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm run validate
      - run: npm publish --tag ${{ github.event.inputs.tag }} --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
      day: monday
    open-pull-requests-limit: 10
    labels:
      - dependencies
    commit-message:
      prefix: 'chore(deps):'
    groups:
      dev-dependencies:
        dependency-type: development
        update-types: [minor, patch]
      production-dependencies:
        dependency-type: production
        update-types: [minor, patch]

  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    labels:
      - ci
    commit-message:
      prefix: 'ci:'
```

### `LICENSE`

```
MIT License

Copyright (c) 2026-present DecentralChain

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 3 — SOURCE CODE MIGRATION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 3A — Dependency Elimination

**Goal:** Zero `@waves/*` imports. Zero `npm:` aliases. Zero `file:` protocol references.

```bash
# Search for ALL of these patterns — every hit must be resolved:
grep -ri "@waves/" --include="*.ts" --include="*.js" --include="*.json" .
grep -ri "npm:@waves" --include="*.json" .
grep -ri "file:" --include="*.json" . | grep -v node_modules
grep -ri "wavesplatform\|waves\.exchange\|wavesnodes\.com\|wavesexplorer" --include="*.ts" --include="*.js" .
```

For each `@waves/*` import found:

| Current Import | Action |
|---------------|--------|
| `@waves/foo` has a published `@decentralchain/foo` | Replace import |
| `@waves/foo` has a workspace-local equivalent | Use `@decentralchain/foo` with pinned version |
| `@waves/foo` has no equivalent | Vendor the code (inline it) or document in KNOWN_ISSUES.md |

> **Critical lesson learned:** During the DCC migration, 38 `package.json` items
> were resolved across 19 packages (16 npm aliases, 14 direct deps, 1 file: ref,
> 2 outdated versions, 3 legacy names, 2 unscoped packages). Use this as a checklist.

### 3B — Source Code Refactoring

Apply to EVERY source file in `src/`:

- [ ] **Remove all `@waves` imports** — replace with `@decentralchain/*`
- [ ] **Replace `WAVES` token name** with `DCC` in code, constants, and comments
- [ ] **Remove CJS remnants** — no `require()`, `module.exports`, `__dirname`, `__filename`
  - `__dirname` → `import.meta.dirname` (Node 21.2+) or `new URL('.', import.meta.url).pathname`
  - `__filename` → `import.meta.filename` or `new URL(import.meta.url).pathname`
  - `require()` → `import` / `await import()`
  - `module.exports` → `export` / `export default`
- [ ] **Remove dead code** — unused exports, unreachable branches, `if (false)`, dead variables
- [ ] **Add JSDoc/TSDoc** on all public APIs — every exported function, class, type, and constant
- [ ] **Add input validation** with descriptive `TypeError` messages:
  ```typescript
  if (typeof input !== 'string') {
    throw new TypeError(`Expected string, received ${typeof input}`);
  }
  ```
- [ ] **Preserve error causes** when re-throwing:
  ```typescript
  catch (e) {
    throw new Error('Descriptive message', { cause: e });
  }
  ```
- [ ] **Use `crypto.getRandomValues()`** instead of `Math.random()` for any security-relevant values
- [ ] **Make exported data immutable** — `Object.freeze()`, `as const`, `readonly`
- [ ] **Ensure tree-shakeability** — named exports only, no side effects at module level
- [ ] **Use `import type`** for type-only imports (enforced by `verbatimModuleSyntax`)
- [ ] **Prefer native Node APIs** over external dependencies when possible
- [ ] **Error messages must be actionable** — include what was expected vs what was received
- [ ] **No `console.log`** in production code — only `console.warn` and `console.error` for security warnings

### 3C — Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | kebab-case | `order-pair.ts` |
| Classes | PascalCase | `BigNumber` |
| Functions | camelCase | `createOrderPair` |
| Constants | UPPER_SNAKE_CASE | `MAINNET_DATA` |
| Types | PascalCase with `T` prefix | `TPair`, `TConfig` |
| Interfaces | PascalCase with `I` prefix | `IConfig`, `IProvider` |
| Private methods | camelCase with `_` prefix | `_toLength` |
| Test files | `*.spec.ts` | `index.spec.ts` |
| Config files | lowercase with dots | `biome.json` |

### 3D — Export Structure

Every package must have a barrel `src/index.ts` that re-exports the public API:

```typescript
// src/index.ts — Public API surface
export { createFoo } from './foo.js';
export { type IConfig, type TResult } from './types.js';
export { MAINNET_DATA, TESTNET_DATA } from './constants.js';
```

**Rules:**
- Only export what consumers need — internal helpers stay unexported.
- Use `export type` for type-only exports.
- Barrel file should have ZERO logic — only re-exports.
- Exclude barrel from coverage (it's just re-exports).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 4 — TEST MIGRATION

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 4A — Framework Migration

| From | To | Key Changes |
|------|----|-------------|
| Jest | Vitest | `jest.fn()` → `vi.fn()`, `jest.mock()` → `vi.mock()`, `jest.spyOn()` → `vi.spyOn()` |
| Mocha + Chai | Vitest | `expect(x).to.equal(y)` → `expect(x).toBe(y)`, `assert.throws` → `expect().toThrow()` |
| Tape | Vitest | `t.equal()` → `expect().toBe()`, `t.end()` → remove (async by default) |

**File structure:**
```
test/
├── index.spec.ts          # Main functionality tests
├── edge-cases.spec.ts     # Boundary value tests
├── errors.spec.ts         # Error path tests
└── fixtures/              # Test data (if needed)
    └── test-vectors.ts
```

### 4B — Test Quality Requirements

Every test file must demonstrate enterprise quality:

- [ ] **Happy path**: Every public function has at least one successful-use test
- [ ] **Error paths**: Every `throw` and `catch` block has a test that triggers it
- [ ] **Edge cases**: Empty strings, `null`, `undefined`, 0, negative numbers, `Number.MAX_SAFE_INTEGER`, extremely long strings, unicode edge cases
- [ ] **Round-trip tests**: For serialize/deserialize, encrypt/decrypt, encode/decode pairs — verify `f(g(x)) === x`
- [ ] **Determinism tests**: Same input → same output (especially for signing, hashing)
- [ ] **Immutability tests**: Verify public objects are frozen and cannot be mutated
- [ ] **No network in unit tests**: Tests must not depend on external services
- [ ] **No hardcoded real secrets**: Test seeds and keys must be clearly synthetic/known test values
- [ ] **Test isolation**: No shared mutable state, no execution order dependencies
- [ ] **Replace `@waves` test fixtures** with DecentralChain equivalents where possible

### 4C — Coverage Thresholds

| Project Stage | Branches | Functions | Lines | Statements |
|--------------|----------|-----------|-------|------------|
| **New / greenfield** | 90% | 90% | 90% | 90% |
| **Freshly migrated** (first release) | 70% | 70% | 70% | 70% |
| **Post-stabilization** (second release) | 80% | 80% | 80% | 80% |
| **Steady state** | 90% | 90% | 90% | 90% |

> **Lesson learned (DCC-18):** Starting at 90% for a large migrated codebase is
> unrealistic. `seedUtils` had only 2.77% coverage — the most security-critical module.
> Start at 70%, add targeted tests for uncovered critical paths, ratchet up.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 5 — GOVERNANCE DOCUMENTS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Every package must include ALL of these. No exceptions.

### `README.md`

Use the standardized DecentralChain SDK README template:

```markdown
<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">{{PACKAGE_NAME}}</h3>

<p align="center">
  {{DESCRIPTION}}
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/{{PACKAGE_NAME}}"><img src="https://img.shields.io/npm/v/{{PACKAGE_NAME}}?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/{{PACKAGE_NAME}}" alt="license" /></a>
  <a href="https://bundlephobia.com/package/{{PACKAGE_NAME}}"><img src="https://img.shields.io/bundlephobia/minzip/{{PACKAGE_NAME}}" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/{{PACKAGE_NAME}}" alt="node" /></a>
</p>

---

## Overview

{{2-3 sentence description of what the library does and why it exists.}}

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

\`\`\`bash
npm install {{PACKAGE_NAME}}
\`\`\`

> Requires **Node.js >= {{MIN_NODE}}** and an ESM environment (`"type": "module"`).

## Quick Start

\`\`\`typescript
{{Compelling, minimal code example showing the primary use case}}
\`\`\`

## API Reference

{{Full API documentation with parameter tables, return types, throws docs}}

## Related Packages

| Package | Description |
| --- | --- |
| [`@decentralchain/ts-types`](https://www.npmjs.com/package/@decentralchain/ts-types) | Core TypeScript type definitions |
| [`@decentralchain/bignumber`](https://www.npmjs.com/package/@decentralchain/bignumber) | Arbitrary-precision arithmetic |
| ... (relevant packages only) |

## Development

\`\`\`bash
git clone https://github.com/{{REPO_ORG}}/{{REPO_NAME}}.git
cd {{REPO_NAME}}
npm install
\`\`\`

| Script | Description |
| --- | --- |
| `npm test` | Run tests (Vitest) |
| `npm run test:coverage` | Coverage report |
| `npm run build` | Build ESM bundle |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |
| `npm run bulletproof` | Format → lint → typecheck → test |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)
```

### `CONTRIBUTING.md`

```markdown
# Contributing to {{PACKAGE_NAME}}

Thank you for your interest in contributing!

## Code of Conduct

By participating, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Prerequisites

- **Node.js** >= {{MIN_NODE}} ({{RECOMMENDED_NODE}} recommended — see `.node-version`)
- **npm** >= 10 (latest stable recommended)

## Setup

\`\`\`bash
git clone https://github.com/{{REPO_ORG}}/{{REPO_NAME}}.git
cd {{REPO_NAME}}
npm install
\`\`\`

## Scripts

| Command | Description |
| --- | --- |
| `npm run build` | Build distribution files |
| `npm test` | Run tests with Vitest |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with V8 coverage |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Biome lint |
| `npm run lint:fix` | Biome lint with auto-fix |
| `npm run format` | Format with Biome |
| `npm run validate` | Full CI validation pipeline |
| `npm run bulletproof` | Format + lint fix + typecheck + test |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test |

## Workflow

1. Fork → branch from `main` (`feat/my-feature`)
2. Make changes with tests
3. `npm run bulletproof`
4. Commit with [Conventional Commits](https://www.conventionalcommits.org/)
5. Push → open PR

### Commit Convention

\`\`\`
feat: add new method
fix: handle edge case
docs: update API reference
chore: bump dependencies
test: add coverage for X
refactor: simplify implementation
\`\`\`

## Standards

- **Strict mode** — all TypeScript strict flags enabled
- **Biome** — auto-formatting and linting on commit
- **Coverage** — thresholds enforced (90%+)
- **Immutable** — operations return new instances where applicable
- **ESM-only** — no CJS, no require()

## PR Checklist

- [ ] Tests added/updated
- [ ] `npm run bulletproof` passes
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventional commits
```

### `SECURITY.md`

```markdown
# Security Policy

## Supported Versions

| Version | Supported |
| --- | --- |
| {{PACKAGE_VERSION}} (current) | :white_check_mark: |
| < {{MAJOR}}.0.0 | :x: |

## Reporting a Vulnerability

**Do NOT open a public GitHub issue.**

Email **info@decentralchain.io** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact assessment
4. Suggested fix (optional)

### Response Timeline

- **Acknowledgement**: 48 hours
- **Assessment**: 5 business days
- **Critical patch**: 14 days
- **Lower severity**: 30 days

## Best Practices

- Use the latest supported version
- Pin dependencies with lockfiles
- Run `npm audit` regularly
- Never expose seed phrases or private keys in logs
```

### `CODE_OF_CONDUCT.md`

Use **Contributor Covenant v2.1** verbatim from:
https://www.contributor-covenant.org/version/2/1/code_of_conduct.html

Enforcement contact: `info@decentralchain.io`

### `CHANGELOG.md`

```markdown
# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html)

## [{{PACKAGE_VERSION}}] - {{CURRENT_DATE}}

### Changed

- **BREAKING**: Migrated to pure ESM (`"type": "module"`).
- Minimum Node.js version is now {{MIN_NODE}}.
- Replaced {{PREVIOUS_TEST_RUNNER}} with Vitest.
- Replaced {{PREVIOUS_BUILD_TOOL}} with tsup.
- Upgraded all dependencies to latest stable versions.
- Rebranded from `{{PREVIOUS_SCOPE}}` to `@decentralchain`.

### Added

- TypeScript strict mode with full type safety.
- Biome linting + formatting.
- Biome auto-formatting with Lefthook pre-commit hooks.
- GitHub Actions CI pipeline (Node {{NODE_MATRIX}}).
- Dependabot for automated dependency updates.
- Code coverage with V8 provider and threshold enforcement.
- Bundle size budget enforcement via size-limit.
- Package validation via publint and attw.
- CONTRIBUTING.md, SECURITY.md, CODE_OF_CONDUCT.md.

### Removed

- Legacy build tooling ({{PREVIOUS_BUILD_TOOL}}).
- {{PREVIOUS_PM}} lockfile.
- All `@waves/*` dependencies and branding.
- CommonJS output (ESM-only).
```

### `.github/ISSUE_TEMPLATE/bug_report.md`

```markdown
---
name: Bug report
about: Create a report to help us improve
title: '[BUG]'
labels: bug
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. ...
2. ...

**Expected behavior**
What you expected to happen.

**Environment:**
- OS: [e.g. Ubuntu 24.04]
- Node.js: [e.g. 24.0.0]
- Package version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

### `.github/ISSUE_TEMPLATE/feature_request.md`

```markdown
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE]'
labels: feature
assignees: ''
---

**Abstract**
Is your feature request related to a problem? Please describe.

**Motivation and Purposes**
Why is this needed?

**Specification**
Describe the desired behavior. Include API examples if applicable.

**Backwards Compatibility**
Can this affect existing features?
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 6 — DEPENDENCY POLICY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Prefer

- **Zero runtime dependencies** when possible (leaf packages should be dependency-free)
- Well-maintained, audited libraries with active maintenance
- Minimal dependency count (fewer = smaller attack surface)
- Native Node APIs when possible (`crypto`, `buffer`, `util`)
- Pure ESM packages
- Packages with TypeScript types included (not `@types/*` needed)

### Avoid (Reject Unless Justified)

| Rejected Dependency Pattern | Why | Action |
|---------------------------|-----|--------|
| `@waves/*` packages | Supply chain risk, brand confusion | Replace with `@decentralchain/*` |
| `npm:@waves/*` aliases | Alias is a supply chain vector | Remove alias, use real package |
| `file:` protocol refs | Breaks in CI, not reproducible | Use published versions |
| CJS-only packages in ESM project | Module format mismatch | Vendor or find ESM alternative |
| Packages last published > 2 years ago | Maintenance risk | Vendor or replace |
| Packages with > 10 transitive deps | Attack surface | Evaluate alternatives |
| `Math.random()` for IDs/nonces | Not cryptographically secure | Use `crypto.getRandomValues()` |
| Deprecated packages (`request`, `node-fetch<3`) | Known issues | Use `fetch()` (built into Node 21+) |
| Heavy packages unless justified | Bundle bloat | Check bundlephobia first |
| Packages with native bindings | portability | Unless critical (e.g. @noble/hashes) |

### Audit Process for New Dependencies

Before adding ANY dependency:

1. Check npm page — is it actively maintained?
2. Check bundlephobia.com — what's the size impact?
3. Run `npm audit` after install — any vulnerabilities?
4. Verify it ships ESM (`"type": "module"` or `"exports"` field)
5. Verify TypeScript types are included or `@types/*` exists
6. Run `npm ls <package>` — check for duplicate versions
7. Count transitive dependencies — fewer is better

### Dead Code Detection

After migration, run knip (installed globally) to detect:

```bash
npx knip
```

Fix all findings except **intentional semantic aliases** (e.g., `isPublicKey = isHash`
where the alias provides domain clarity).

> **Lesson learned (DCC-18):** knip found 14 unused named exports in test helpers,
> 1 unused devDependency (`buffer`), and duplicate exports in validators — all were
> legitimate cleanup targets.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 7 — QUALITY PIPELINE (Bulletproof System)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The bulletproof system ensures **no broken code can be committed**. This is enforced
at three levels:

### Level 1 — Git Commit (Lefthook)

```
git commit → lefthook pre-commit → lint (staged files) + typecheck (parallel)
```

- Lefthook runs Biome on **staged files only** via `{staged_files}` glob (fast)
- `typecheck` runs on the full project **in parallel** with lint
- `stage_fixed: true` auto-stages Biome's auto-fixes
- **If ANY step fails, the commit is blocked**

### Level 2 — Manual Validation

```bash
npm run bulletproof       # auto-fix + validate
npm run bulletproof:check # check-only (CI mode)
```

Pipeline: `format → lint → typecheck → test`

### Level 3 — CI Pipeline (GitHub Actions)

Every push and PR triggers the full quality gate:

```
lint:check → typecheck → test:coverage → build → publint → attw → size-limit
```

### Tool Responsibility Matrix

| Concern | Biome | TypeScript | Vitest | publint | attw | size-limit |
|---------|:-----:|:----------:|:------:|:-------:|:----:|:----------:|
| Formatting | **✓** | | | | | |
| Code style | **✓** | | | | | |
| Import order | **✓** | | | | | |
| Type safety | | **✓** | | | | |
| Dead code | **✓** | secondary | | | | |
| Runtime correctness | | | **✓** | | | |
| Package structure | | | | **✓** | | |
| Type exports | | | | | **✓** | |
| Bundle size | | | | | | **✓** |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 8 — PUBLISHING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### Pre-Publish Checklist

```bash
# Every one of these must exit 0:
npm run format:check        # ✅ No formatting issues
npm run lint                # ✅ No lint errors
npm run typecheck           # ✅ No type errors
npm run test                # ✅ All tests pass
npm run build               # ✅ Clean build
npm run check:publint       # ✅ Package structure valid
npm run check:exports       # ✅ Type exports valid
npm run check:size          # ✅ Within size budget
npm audit --audit-level=high # ✅ No high/critical vulnerabilities
npm pack --dry-run          # ✅ Package contents look correct (no src/, no test/)
npx knip                    # ✅ No dead code (or documented exceptions only)
```

### Publish Command

```bash
# First publish (pre-release):
npm publish --tag next --access public --provenance false

# Promote to stable:
npm dist-tag add {{PACKAGE_NAME}}@{{PACKAGE_VERSION}} latest

# CI publish (with provenance — requires GitHub Actions OIDC):
npm publish --tag next --provenance --access public
```

> **Note:** `--provenance false` is needed for manual publishes because
> `publishConfig.provenance: true` in package.json triggers OIDC token
> verification which only works in GitHub Actions. For manual publishes,
> override with the CLI flag.

### Dependency Tier Publishing Order

If the package has `@decentralchain/*` dependencies, publish in dependency order:

```
TIER 0: Leaf packages (zero @decentralchain/* runtime deps)
TIER 1: Packages depending only on TIER 0
TIER 2: Packages depending on TIER 0 + TIER 1
TIER 3: Packages depending on TIER 0 + TIER 1 + TIER 2
TIER 4: Top-level packages
```

Wait for CDN propagation (~30s) between tiers. If `npm install` fails after
publishing, use `--registry https://registry.npmjs.org` to bypass CDN cache.

### Lockfile Generation

After all dependencies are published:

```bash
npm install --registry https://registry.npmjs.org
git add package-lock.json
LEFTHOOK=0 git commit -m "build: generate package-lock.json"
git push
```

`LEFTHOOK=0` skips the pre-commit hook (lockfile changes don't need linting).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## STEP 9 — SECURITY HARDENING

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Perform these checks during migration. For a full security audit, use `4-AUDIT.md`
after this prompt completes.

### Supply Chain

- [ ] `npm audit --audit-level=high` — zero high/critical
- [ ] No `npm:@waves/*` aliases remain
- [ ] No `file:` protocol dependencies
- [ ] `package-lock.json` exists and is committed
- [ ] `publishConfig.provenance: true` is set
- [ ] Count runtime dependencies — fewer is better, 0 is ideal for leaf packages

### Code Security

- [ ] No `Math.random()` in security-relevant contexts
- [ ] No `console.log` of seeds, private keys, or sensitive data
- [ ] All `catch` blocks preserve error cause with `{ cause: e }`
- [ ] No `eval()`, `new Function()`, or `innerHTML` in library code
- [ ] Exported objects are frozen (`Object.freeze`) where immutability is expected
- [ ] No hardcoded credentials, API keys, or real private keys in tests

### Cryptography (if `HAS_CRYPTO`)

- [ ] Uses audited libraries (@noble/hashes, @noble/curves, @noble/ciphers)
- [ ] No custom crypto implementations without justification
- [ ] No MD5 or SHA1 for security-critical operations
- [ ] Key material is never logged or included in error messages
- [ ] `crypto.getRandomValues()` for all random number generation

### Network (if `HAS_NETWORK`)

- [ ] HTTPS enforcement — no HTTP fallback
- [ ] Timeouts on all network calls (≤ 30s default)
- [ ] Response validation before use
- [ ] No credentials in URL parameters

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## EXECUTION ORDER

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execute in this exact order. Do not skip steps.

```
 1. Delete legacy files                             (Step 1)
 2. Create all config files                          (Step 2)
 3. Refactor source code — branding + CJS removal   (Step 3A, 3B)
 4. Refactor source code — quality improvements      (Step 3B continued)
 5. Migrate tests to Vitest                          (Step 4)
 6. Write governance docs                            (Step 5)
 7. npm install                                      (resolve all deps)
 8. npm audit --audit-level=high                     (fix vulnerabilities)
 9. npm run bulletproof                              (fix all failures)
10. npm run build                                    (verify clean build)
11. npx knip                                         (fix dead code)
12. npm run validate                                 (full pipeline)
13. Security hardening review                        (Step 9)
14. npm pack --dry-run                               (verify package contents)
```

### Success Criteria

The migration is complete when ALL of the following pass **with zero errors**:

```bash
npm run format:check        # ✅
npm run lint                # ✅
npm run typecheck           # ✅
npm run test                # ✅
npm run build               # ✅
npm run check:publint       # ✅
npm run check:exports       # ✅
npm run check:size          # ✅
npm audit --audit-level=high # ✅
npm pack --dry-run          # ✅ (only dist/, LICENSE, README.md)
npx knip                    # ✅ (zero findings or documented exceptions)
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## REFERENCE: SDK PACKAGE REGISTRY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These are the 19 published `@decentralchain` packages as of March 2026. Use these
as the reference for published versions when pinning internal dependencies.

### Tier 0 — Leaf Packages (Zero `@decentralchain/*` Runtime Deps)

| Package | Version | npm |
|---------|---------|-----|
| `@decentralchain/assets-pairs-order` | 5.0.1 | [npm](https://www.npmjs.com/package/@decentralchain/assets-pairs-order) |
| `@decentralchain/marshall` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/marshall) |
| `@decentralchain/bignumber` | 1.1.1 | [npm](https://www.npmjs.com/package/@decentralchain/bignumber) |
| `@decentralchain/ts-lib-crypto` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/ts-lib-crypto) |
| `@decentralchain/oracle-data` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/oracle-data) |
| `@decentralchain/browser-bus` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/browser-bus) |
| `@decentralchain/parse-json-bignumber` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/parse-json-bignumber) |
| `@decentralchain/ts-types` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/ts-types) |
| `@decentralchain/ledger` | 5.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/ledger) |
| `@decentralchain/protobuf-serialization` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/protobuf-serialization) |
| `@decentralchain/cubensis-connect-types` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/cubensis-connect-types) |

### Tier 1 — First-Level Dependents

| Package | Version | Internal Deps |
|---------|---------|---------------|
| `@decentralchain/data-entities` | 3.0.0 | bignumber |
| `@decentralchain/money-like-to-node` | 1.0.0 | ts-types |
| `@decentralchain/node-api-js` | 2.0.0 | bignumber, ts-lib-crypto, ts-types |

### Tier 2 — Second-Level Dependents

| Package | Version | Internal Deps |
|---------|---------|---------------|
| `@decentralchain/data-service-client-js` | 4.2.0 | bignumber, data-entities |
| `@decentralchain/transactions` | 5.0.0 | marshall, node-api-js, protobuf-serialization, ts-lib-crypto, ts-types |

### Tier 3 — Third-Level Dependents

| Package | Version | Internal Deps |
|---------|---------|---------------|
| `@decentralchain/signature-adapter` | 7.0.0 | bignumber, data-entities, ledger, money-like-to-node, transactions, ts-types |
| `@decentralchain/signer` | 2.0.0 | node-api-js, ts-lib-crypto, ts-types |

### Tier 4 — Top-Level

| Package | Version | Internal Deps |
|---------|---------|---------------|
| `@decentralchain/cubensis-connect-provider` | 1.0.0 | cubensis-connect-types, marshall |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## REFERENCE: LESSONS LEARNED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Captured from the migration of all 19 packages. Apply these to avoid repeating mistakes.

### Build & Config

| Lesson | Source | Impact |
|--------|--------|--------|
| `verbatimModuleSyntax: true` breaks codebases with legacy `import { Type }` patterns | DCC-2 (marshall) | Set to `false` if refactoring cost is too high; document reason |
| `noUnusedLocals: true` in tsconfig flags errors inside `node_modules` when upstream ships `.ts` source | DCC-18 | Keep `false` in tsconfig, enforce via Biome instead |
| `exactOptionalPropertyTypes: true` conflicts with protobuf-generated types | DCC-15 | Keep `false` unless protobuf types are hand-maintained |
| `--provenance false` needed for manual npm publish | All packages | `publishConfig.provenance: true` triggers OIDC verification that only works in GitHub Actions |
| CDN propagation takes ~30s after npm publish | All packages | Use `--registry https://registry.npmjs.org` to bypass CDN cache |
| `LEFTHOOK=0` prefix disables git hooks for automated commits | All packages | Use for lockfile commits and CI-generated changes |

### Testing

| Lesson | Source | Impact |
|--------|--------|--------|
| Start migrated projects at 70% coverage, not 90% | DCC-18 | Unrealistic to hit 90% immediately on large codebases |
| `seedUtils` had 2.77% coverage — the most security-critical module | DCC-18 | Always audit coverage of crypto/security modules first |
| 16 targeted tests brought seedUtils from 2.77% to 88.88% | DCC-18 | Targeted testing of critical paths yields massive ROI |

### Dependencies

| Lesson | Source | Impact |
|--------|--------|--------|
| knip found 14 unused exports in test helpers + 1 unused devDep | DCC-18 | Run knip after every migration |
| `npm:@waves/*` aliases are a supply chain risk | All packages | Eliminate immediately — they alias to external packages |
| 38 `package.json` items were resolved across 19 packages | Full migration | Comprehensive audit is essential |
| Some `@waves` refs are wire-protocol constants (`.proto` files, Ledger firmware) | DCC-13, DCC-15 | Document as acceptable exceptions |

### Git & CI

| Lesson | Source | Impact |
|--------|--------|--------|
| Remote divergence from Copilot PRs requires stash/pull/restore pattern | DCC-6, 7, 8, 10, 11, 15, signer | `git stash && git pull && git show stash@{0}:FILE > FILE && git stash drop` |
| README template differences (Copilot `<div>` vs our `<p align="center">`) cause merge conflicts | DCC-6 | Always overwrite with our standardized template |
| Some repos have moved (DCC-18 `decentralchain-transactions` → `transactions`) | DCC-18 | Check `git remote -v` and update if needed |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## QUALITY STANDARD

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

These packages are the **OFFICIAL SDK for DecentralChain** — a blockchain that handles
real money for real users worldwide. Every package you produce will be depended upon
by wallets, exchanges, and dApps that manage digital assets.

**Design for:**

- **Long-term maintenance** — clear code, comprehensive tests, automated tooling
- **Security** — input validation, immutable data, minimal dependencies, no leaks
- **Scalability** — tree-shakeable, ESM-native, small bundle sizes
- **Professional standards** — governance docs, CI/CD, semantic versioning
- **Institutional credibility** — consistent branding, quality gates, provenance
- **Developer experience** — clear APIs, helpful error messages, thorough documentation

**The litmus test: Would you trust this code with your own money?**

If the answer is not an unqualified **yes**, keep working.

Work iteratively and cautiously. If critical protocol details are missing, **ASK before
proceeding**. For all tooling, configuration, and quality decisions — **execute without
hesitation**.

After this prompt completes, proceed to **4-AUDIT.md** for the final security gate.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Migration History

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This section is a living log of all SDK migration and modernization work. Append new entries as work is completed.

---

### March 5, 2026 — Initial SDK Modernization & Publish

**Scope:** All 19 `@decentralchain` SDK packages
**Operator:** AI-assisted migration session
**Dist-tag:** `@next` (pre-production)

#### What Was Done

- Upgraded all packages to **Node.js 24 LTS** (engines, CI matrices, badges)
- **Pure ESM** builds via tsup with **TypeScript 5.9** strict mode
- Professional README template applied consistently across all 19 repos
- Package lockfiles generated and committed for all 19 repos
- **2,500+ tests** passing across full SDK
- **0 vulnerabilities** across all installs
- All repos committed, pushed, and clean

#### Published Packages

| Tier | Package | Version | npm | GitHub |
|:-----|:--------|:--------|:----|:-------|
| 0 | `@decentralchain/assets-pairs-order` | 5.0.1 | [npm](https://www.npmjs.com/package/@decentralchain/assets-pairs-order) | [repo](https://github.com/Decentral-America/assets-pairs-order) |
| 0 | `@decentralchain/marshall` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/marshall) | [repo](https://github.com/Decentral-America/marshall) |
| 0 | `@decentralchain/bignumber` | 1.1.1 | [npm](https://www.npmjs.com/package/@decentralchain/bignumber) | [repo](https://github.com/Decentral-America/bignumber) |
| 0 | `@decentralchain/ts-lib-crypto` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/ts-lib-crypto) | [repo](https://github.com/Decentral-America/ts-lib-crypto) |
| 0 | `@decentralchain/oracle-data` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/oracle-data) | [repo](https://github.com/Decentral-America/oracle-data) |
| 0 | `@decentralchain/browser-bus` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/browser-bus) | [repo](https://github.com/Decentral-America/browser-bus) |
| 0 | `@decentralchain/parse-json-bignumber` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/parse-json-bignumber) | [repo](https://github.com/Decentral-America/parse-json-bignumber) |
| 0 | `@decentralchain/ts-types` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/ts-types) | [repo](https://github.com/Decentral-America/ts-types) |
| 0 | `@decentralchain/ledger` | 5.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/ledger) | [repo](https://github.com/Decentral-America/ledger) |
| 0 | `@decentralchain/protobuf-serialization` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/protobuf-serialization) | [repo](https://github.com/Decentral-America/protobuf-serialization) |
| 0 | `@decentralchain/cubensis-connect-types` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/cubensis-connect-types) | [repo](https://github.com/Decentral-America/cubensis-connect-types) |
| 1 | `@decentralchain/data-entities` | 3.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/data-entities) | [repo](https://github.com/Decentral-America/data-entities) |
| 1 | `@decentralchain/money-like-to-node` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/money-like-to-node) | [repo](https://github.com/Decentral-America/money-like-to-node) |
| 1 | `@decentralchain/node-api-js` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/node-api-js) | [repo](https://github.com/Decentral-America/node-api-js) |
| 2 | `@decentralchain/data-service-client-js` | 4.2.0 | [npm](https://www.npmjs.com/package/@decentralchain/data-service-client-js) | [repo](https://github.com/Decentral-America/data-service-client-js) |
| 2 | `@decentralchain/transactions` | 5.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/transactions) | [repo](https://github.com/Decentral-America/transactions) |
| 3 | `@decentralchain/signature-adapter` | 7.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/signature-adapter) | [repo](https://github.com/Decentral-America/decentralchain-signature-adapter) |
| 3 | `@decentralchain/signer` | 2.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/signer) | [repo](https://github.com/Decentral-America/signer) |
| 4 | `@decentralchain/cubensis-connect-provider` | 1.0.0 | [npm](https://www.npmjs.com/package/@decentralchain/cubensis-connect-provider) | [repo](https://github.com/Decentral-America/cubensis-connect-provider) |

#### Remaining After This Date

- Promote `@next` → `@latest` when ready for production release
- `cubensis-connect` browser extension (not an npm package) was not part of this publish cycle
- `car-finder` Next.js application — separate migration track
- `dcc-react` React component library — not yet started

---

<!-- APPEND NEW MIGRATION ENTRIES ABOVE THIS LINE -->

---

> **📋 REMINDER — Jira & Commit Convention**
>
> Every change must be tracked in **Jira** (ticket `DCC-###`) and linked via **Conventional Commits**.
>
> Commit format: `<type>(DCC-###): <description>` — imperative mood, lowercase start, no period.
>
> Branch format: `<type>/DCC-###-short-description`
>
> Types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `build` · `ci` · `chore` · `revert`
>
> Full specification: See **1-MIGRATE.md § Documentation & Traceability**.

## --- END PROMPT ---
