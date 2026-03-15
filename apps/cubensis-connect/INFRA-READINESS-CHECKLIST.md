# Cubensis Connect — Infra Readiness Checklist (Approval Handoff)

**Purpose:** close remaining non-code blockers so all TODOs can be resolved cleanly.

## Status Summary

- TypeScript: ✅ clean (`base`, `src`, `test` all pass)
- Remaining blockers: mostly infra/protocol decisions, not implementation bugs

---

## 1) Testnet Genesis & Deterministic E2E Fixtures

**Owner:** Node/DevOps + QA

### Needed from infra

- Final testnet genesis identifier (block hash or tagged release)
- Stable funded test accounts/seeds for automated E2E runs
- Expected balances for those accounts (baseline snapshot)
- Confirmation that these fixtures are long-lived (not ephemeral)

### Unblock criteria

- Same seed/account set passes E2E for at least 3 consecutive CI runs
- Documented fixture file checked in under test constants

### Affected TODOs

- `test/AccountManagement.ts` (seed updates)
- `test/Messages.ts` (seed updates)
- `test/NetworkManagement.ts` (seed updates)
- `test/Others.ts` (seed updates)
- `test/Password.ts` (seed updates)
- `test/Settings.ts` (seed updates)
- `test/Signature.ts` (seed updates)
- `test/TabsManipulation.ts` (seed updates)

---

## 2) DCC E2E Domains / Origins Finalization

**Owner:** Infra + Security + Product

### Needed from infra

- Canonical allowlisted origins for E2E (mainnet/testnet/stagenet where relevant)
- Canonical test origins replacing legacy `waves.tech` assumptions
- DNS/TLS readiness for those origins

### Unblock criteria

- `test/utils/constants.ts` updated to final DCC domains
- E2E origin/permission tests pass consistently in CI

### Affected TODOs

- `test/utils/constants.ts` (replace placeholder domains)
- `test/Settings.ts` (origin migration note)
- `test/Signature.ts` (network URL migration note)

---

## 3) Suspicious Asset Source Ownership

**Owner:** Data platform + Security

### Needed from infra

- DCC-owned canonical suspicious-token source URL (CSV/JSON)
- Ownership and update process for that feed
- SLA expectations (update frequency + availability)

### Unblock criteria

- `src/controllers/assetInfo.ts` points only to DCC-owned source
- Data schema and update behavior validated in one integration test

### Affected TODOs

- `src/controllers/assetInfo.ts` (waves-community path migration)

---

## 4) Auth Prefix Protocol Decision (Wire-Format)

**Owner:** Protocol + SDK

### Needed from protocol team

- Decision: keep `WavesWalletAuthentication` indefinitely, or introduce `DccWalletAuthentication`
- If introducing new prefix:
  - rollout plan (version gate)
  - backward compatibility behavior
  - signed-message verification matrix

### Unblock criteria

- ADR or protocol note published
- SDK/message format tests updated for decision

### Affected TODOs

- `src/messages/utils.ts`
- `src/controllers/message.ts`
- related protocol note in `test/Signature.ts`

---

## 5) Legacy Global Alias Sunset Plan

**Owner:** Wallet team + Ecosystem/devrel

### Needed from product/ecosystem

- Sunset date for legacy globals: `WavesKeeper`, `Waves`, `KeeperWallet`
- Migration communication plan to dApp integrators
- Version where aliases switch from enabled → deprecated warning → removed

### Unblock criteria

- Published deprecation policy with date
- No critical integrator still depending on aliases

### Affected TODOs

- `src/inpage.ts` (alias removal timing)

---

## 6) Test Architecture Cleanup (No Infra Dependency)

**Owner:** Wallet frontend/test engineering

### Work remaining

- Move assertion-heavy TODO checks from broad E2E specs into focused unit tests

### Unblock criteria

- New unit tests added and green
- Corresponding TODO markers removed

### Affected TODOs

- `test/Messages.ts`
- `test/Signature.ts` (3 locations)

---

## Approve/Track Template

Use this section directly in Jira/issue tracking.

| Item | Decision Required | Owner | Due Date | Approved (Y/N) |
|---|---|---|---|---|
| 1. Testnet genesis fixtures | Final account/seed fixture set | Node/DevOps + QA |  |  |
| 2. DCC e2e domains | Final origin list + DNS/TLS | Infra + Security |  |  |
| 3. Suspicious asset feed | DCC canonical source URL | Data + Security |  |  |
| 4. Auth prefix | Keep or migrate prefix strategy | Protocol + SDK |  |  |
| 5. Alias sunset | Deprecation/removal timeline | Wallet + DevRel |  |  |
| 6. Test architecture | Move E2E TODO assertions to unit tests | FE/Test Eng |  |  |

---

## Definition of Done

- All 6 checklist items have explicit decisions and owners
- Infra-dependent constants/endpoints updated in code
- Protocol-dependent behavior documented and tested
- Remaining TODO/FIXME markers reduced to zero or explicitly justified with permanent comments (no TODO)
- Full typecheck remains green across `tsconfig.base`, `src/tsconfig`, `test/tsconfig`
