# Backend Dependencies Readiness Assessment

> **Scope:** All external services that DecentralChain SDK applications depend on
> at runtime. This document is a living checklist — update the Status column
> before each production release gate sign-off.

---

## 1. Dependency Map

```
Cubensis Connect (browser extension)
  └── DecentralChain Node API  (mainnet + testnet)
  └── Remote Config CDN        (feature flags, node list)
  └── Data Service API         (price feeds, order history)

Exchange SPA
  └── DecentralChain Node API  (mainnet)
  └── DecentralChain Matcher   (DEX order matching)
  └── Data Service API         (market data, history)
  └── TradingView Charts proxy (via nginx /trading-view)

Scanner (React Router 7 SSR)
  └── DecentralChain Node API  (mainnet + testnet)
  └── Data Service API         (transaction enrichment)
```

---

## 2. Service Health Matrix

### 2.1 DecentralChain Node API

| Attribute | Mainnet | Testnet |
|-----------|---------|---------|
| Base URL | `https://nodes.decentralchain.io` | `https://nodes-testnet.decentralchain.io` |
| Health endpoint | `/blocks/height` | `/blocks/height` |
| Expected response | `{"height": <positive int>}` | `{"height": <positive int>}` |
| Operator | DCC team | DCC team |
| SLA target | 99.9% uptime | 99.0% uptime |
| Last verified | (fill at release time) | (fill at release time) |
| Status | ☐ PASS / ☐ FAIL | ☐ PASS / ☐ FAIL |

**Verification command:**
```bash
curl -sf https://nodes.decentralchain.io/blocks/height | jq .height
curl -sf https://nodes-testnet.decentralchain.io/blocks/height | jq .height
```

---

### 2.2 Data Service API

| Attribute | Value |
|-----------|-------|
| Base URL | `https://api.decentralchain.io` |
| Health endpoint | `/` |
| Expected response | JSON with `.version` field |
| Operator | DCC team |
| SLA target | 99.5% uptime |
| Last verified | (fill at release time) |
| Status | ☐ PASS / ☐ FAIL |

**Verification command:**
```bash
curl -sf https://api.decentralchain.io/ | jq .version
```

---

### 2.3 DEX Matcher API

| Attribute | Value |
|-----------|-------|
| Base URL | `https://mainnet-matcher.decentralchain.io` |
| Health endpoint | `/matcher` |
| Expected response | Base58-encoded public key string |
| Operator | DCC team |
| SLA target | 99.5% uptime |
| Last verified | (fill at release time) |
| Status | ☐ PASS / ☐ FAIL |

**Verification command:**
```bash
curl -sf https://mainnet-matcher.decentralchain.io/matcher
```

---

### 2.4 Remote Config CDN

| Attribute | Value |
|-----------|-------|
| Base URL | `https://raw.githubusercontent.com/Decentral-America/dcc-configs/main/` |
| Health endpoint | `main.json` |
| Expected response | Valid JSON object with `.version` field |
| Operator | GitHub (CDN) + DCC team (content) |
| SLA target | GitHub CDN SLA (99.9%) |
| Last verified | (fill at release time) |
| Status | ☐ PASS / ☐ FAIL |

**Verification command:**
```bash
curl -sf https://raw.githubusercontent.com/Decentral-America/dcc-configs/main/main.json | jq .version
```

---

### 2.5 TradingView Charts Proxy (Exchange only)

| Attribute | Value |
|-----------|-------|
| Upstream | `https://charts.decentral.exchange` |
| Internal path | `/trading-view` (nginx proxy_pass) |
| Health check | Load any chart page in Exchange and confirm chart renders |
| Operator | DCC team / third-party |
| Last verified | (fill at release time) |
| Status | ☐ PASS / ☐ FAIL |

---

## 3. Cross-Service Compatibility Matrix

Verify that no version bumps on any backend API introduced breaking changes since
the last release.

| Consumer | Backend API | Breaking-change risk | Signed off? |
|----------|-------------|---------------------|-------------|
| Cubensis Connect | Node API v2 | Transaction serialisation format | ☐ |
| Cubensis Connect | Data Service | Asset info schema | ☐ |
| Exchange | Matcher | Order type fields | ☐ |
| Exchange | Node API | Block / transaction response schema | ☐ |
| Scanner | Node API | Block header format | ☐ |
| Scanner | Data Service | Transaction enrichment fields | ☐ |

---

## 4. Rollback Contacts

| Service | Team / Owner | Emergency contact |
|---------|-------------|-------------------|
| DecentralChain Node API | DCC Infrastructure | (fill in) |
| Data Service | DCC Backend | (fill in) |
| DEX Matcher | DCC Backend | (fill in) |
| Remote Config CDN | DCC Frontend | (fill in) |

---

## 5. Pre-Release Run-Book

1. Run all verification commands in Section 2 from a production-equivalent
   environment; confirm all return HTTP 200 with expected payloads.
2. Check the compatibility matrix in Section 3; confirm no pending breaking
   changes are outstanding.
3. Attach screenshot evidence to the release Jira ticket.
4. Complete the sign-off matrix in [GO-NO-GO-INFRA.md](./GO-NO-GO-INFRA.md)
   Section 5 before merge.

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-03 | Josué Rojas | Initial version (DCC-142) |
