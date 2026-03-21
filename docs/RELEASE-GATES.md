# Cubensis Connect — Release Gate Checklist

> **Purpose:** Every release of the Cubensis Connect browser extension must pass
> all gates in this document before a build is promoted to the Chrome Web Store,
> Firefox AMO, or any public distribution channel.

---

## Gate 1 — Supply-Chain Integrity

| Check | Criteria | Owner |
|-------|----------|-------|
| No `@keeper-wallet/*` packages | `grep -r "keeper-wallet" apps/cubensis-connect/package.json` returns zero matches | Platform Infra |
| No `amazon-cognito-identity-js` | `grep "amazon-cognito" apps/cubensis-connect/package.json` returns zero matches | Platform Infra |
| No WX/Cognito identity code | `grep -r "IdentityController\|identityController\|cognitoSessions" apps/cubensis-connect/src/` returns zero matches | Platform Infra |
| SBOM generated | `pnpm sbom` (or equivalent) attached to the release PR | Platform Infra |

---

## Gate 2 — Build Quality

| Check | Criteria | Owner |
|-------|----------|-------|
| TypeScript passes | `pnpm nx run cubensis-connect:typecheck` — zero errors in files we own (pre-existing React-19 compat errors documented as known) | Engineering |
| Biome lint clean | `pnpm nx run cubensis-connect:biome-lint` — zero errors | Engineering |
| Unit tests pass | `pnpm nx run cubensis-connect:test` — 100% green | Engineering |
| Bundle size ≤ limit | `pnpm nx run cubensis-connect:build` — Chrome zip ≤ 10 MB | Engineering |

---

## Gate 3 — Manifest & Extension Policy

| Check | Criteria | Owner |
|-------|----------|-------|
| MV3 Chrome | Built `dist/chrome/manifest.json` contains `"manifest_version": 3` and `host_permissions` | Engineering |
| MV3 Edge | Built `dist/edge/manifest.json` contains `"manifest_version": 3` and `host_permissions` | Engineering |
| MV2 Firefox | Built `dist/firefox/manifest.json` contains `"manifest_version": 2` | Engineering |
| CSP no-eval | `content_security_policy` contains `script-src 'self' 'wasm-unsafe-eval'` — no `unsafe-eval`, no `unsafe-inline` | Security |
| Permissions minimal | `permissions` array contains only: `alarms`, `clipboardWrite`, `idle`, `storage`, `unlimitedStorage`, `tabs` | Security |
| No third-party analytics | Build output contains no calls to unreviewed analytics endpoints | Security |

---

## Gate 4 — UX / Onboarding Safety

| Check | Criteria | Owner |
|-------|----------|-------|
| Seed loss warning displayed | BackupSeed page renders `backupSeed.lossWarning` text in all 10 supported locales | Product |
| No email/Cognito import path | `/import-email` route absent from built bundle; no `importEmail` i18n keys | Product |
| Password strength enforcement | New vault creation rejects passwords shorter than 8 characters | Engineering |

---

## Gate 5 — Infrastructure Readiness

| Check | Criteria | Owner |
|-------|----------|-------|
| Cognito pools decommissioned | AWS Cognito pools `eu-central-1_AXIpDLJQx` and `eu-central-1_6Bo3FEwt5` are deleted or belong to DCC | AWS / Ops |
| Node API reachable | `https://nodes.decentralchain.io` responds 200 on mainnet & testnet | Ops |
| Data service reachable | `https://api.decentralchain.io` health-check green | Ops |
| Remote config reachable | `https://raw.githubusercontent.com/Decentral-America/dcc-configs/main/main.json` returns valid JSON | Ops |

---

## Gate 6 — Store Submission

| Check | Criteria | Owner |
|-------|----------|-------|
| Chrome Web Store listing ready | Store listing text, screenshots, and privacy policy updated | Marketing |
| Firefox AMO listing ready | AMO listing and source code submission package prepared | Marketing |
| Version bump applied | `CUBENSIS_VERSION` env var set; `CHANGELOG.md` updated | Engineering |
| Release PR approved | Minimum 2 engineering approvals + 1 security approval | All |

---

## Waiver Process

Any gate that cannot be fully satisfied at release time must be:
1. Documented in the release PR description with risk assessment
2. Approved by the engineering lead and security lead
3. Given a remediation deadline (maximum 30 days post-release)
4. Tracked in Jira under the DCC-115 epic
