# Production Secrets Management & Observability Baseline

> **Scope:** All DecentralChain production services — Cubensis Connect extension,
> Exchange SPA, Scanner, and their supporting backend APIs.

---

## 1. Secret Classification

| Class | Examples | Allowed Storage |
|-------|----------|-----------------|
| **Tier 1 — Critical** | Signing keys, deployment keys, Chrome Web Store API key, Apple/Firefox review credentials | Secrets manager (AWS Secrets Manager / Vault) only. Never in code or CI env vars. |
| **Tier 2 — Service** | API keys for third-party services (e.g., Sentry DSN, analytics), JWT signing secrets | CI/CD secrets (GitHub Actions encrypted secrets). Rotated quarterly. |
| **Tier 3 — Config** | Feature flags, node URLs, matcher URLs | Environment variables injected at build time or via remote config. Not secret; may be in `.env.example`. |

**Hard rules:**

1. No Tier 1 or Tier 2 secret ever appears in source code, commit history, or
   build logs. Enforce with pre-commit scanning (e.g., `truffleHog`, `gitleaks`).
2. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `SENTRY_AUTH_TOKEN`, and any
   bearer tokens are always Tier 1/2 — even if they look like Tier 3.
3. `.env` files containing real secrets are gitignored. `.env.example` contains
   only placeholder values.

---

## 2. Secret Rotation Policy

| Secret | Rotation Cadence | Rotation Owner | Revoke-on-Trigger |
|--------|-----------------|----------------|-------------------|
| Chrome Web Store OAuth client secret | 90 days | DevOps | Breach, staff change |
| Firefox AMO API credentials | 90 days | DevOps | Breach, staff change |
| npm publish token | 90 days | DevOps | Breach, package mis-publish |
| Sentry DSN | 180 days | Engineering | Breach |
| GitHub Actions secrets | 180 days | DevOps | Repository compromise |
| Deployment SSH keys | 365 days | DevOps | Staff departure, breach |

**Emergency rotation:** Any suspected exposure triggers immediate rotation
within 1 business hour. Open a Jira `security` ticket (P0) and notify the
Security Lead.

---

## 3. Monitoring & Alerting Baseline

### 3.1 Extension (Cubensis Connect)

| Signal | Tool | Alert Threshold |
|--------|------|-----------------|
| Unhandled JS errors | Sentry | >5 new unique errors / hour |
| Chrome Web Store review rejection | Manual / CWS email | Any rejection |
| Store version mismatch (pinned version ≠ latest) | CI pipeline check | On every release |

### 3.2 Exchange SPA & Scanner

| Signal | Tool | Alert Threshold |
|--------|------|-----------------|
| HTTP 5xx rate | nginx access log + log aggregator | >1% of requests over 5 min |
| HTTP 4xx rate (unexpected) | nginx access log | >5% over 5 min |
| Container health-check failures | Docker / Railway | Any 3 consecutive failures |
| Response latency P99 | Application monitoring (Sentry perf / Datadog) | >3 s over 5 min |
| Memory / CPU saturation | Container metrics | >90% sustained for 10 min |

### 3.3 DecentralChain Node API

| Signal | Tool | Alert Threshold |
|--------|------|-----------------|
| Node height lag | Custom probe | Height stalled >60 s |
| API endpoint availability | Uptime monitor (e.g., UptimeRobot) | Downtime >2 min |
| Block production gap | Custom probe | >120 s since last block |

---

## 4. Key Management Procedures

### 4.1 No Hardcoded Secrets

All secrets must be injected via one of:

```
# Acceptable:
SENTRY_DSN=${{ secrets.SENTRY_DSN }}   # CI/CD variable
const dsn = process.env.SENTRY_DSN;    # Runtime env var

# Never acceptable:
const dsn = "https://abc123@o123.ingest.sentry.io/456";  # Hardcoded
```

### 4.2 Audit Log Requirements

Secrets management systems must produce immutable audit logs for:
- Access (who read the secret and when)
- Rotation (who rotated and when)
- Deletion (who deleted and when)

Logs must be retained for a minimum of 90 days.

### 4.3 Least-Privilege Principle

Each service identity (CI job, container, developer) gets only the minimum
permissions required. Review and trim over-privileged roles quarterly.

---

## 5. Incident Response — Credential Exposure

1. **Detect** — automated scan alert, developer report, or third-party
   disclosure
2. **Contain (< 1 h)** — revoke the exposed credential immediately; document
   in incident Jira ticket
3. **Assess** — determine blast radius: what systems could the credential access?
4. **Rotate** — issue replacement credential via secrets manager; update all
   consumers
5. **Remediate** — if the secret was committed: rewrite git history (only if
   not yet pushed) or immediately rotate and treat as compromised regardless
6. **Post-mortem** — within 5 business days, root-cause analysis and control
   improvements documented in the Jira ticket

---

## 6. Supply-Chain Integrity Checks

Run on every CI pipeline:

```bash
# Dependency vulnerability scan
pnpm audit --audit-level=high

# Secret scan on staged diff
gitleaks detect --source . --log-level warn

# SBOM generation (optional, required for store submissions)
# syft . -o spdx-json > sbom.spdx.json
```

---

## 7. Observability Stack Recommendation

| Layer | Recommended Tool | Notes |
|-------|-----------------|-------|
| Error tracking | Sentry | Already referenced in exchange/scanner code |
| Uptime monitoring | UptimeRobot or Better Uptime | Free tier covers all production endpoints |
| Log aggregation | Loki + Grafana (self-hosted) or Papertrail | Pair with nginx access logs |
| Metrics | Prometheus + Grafana or Datadog | Containerised via docker-compose |
| Alerting | PagerDuty or Grafana Alerts | Route P0/P1 to on-call; P2+ to Slack |

---

## Revision History

| Date | Author | Change |
|------|--------|--------|
| 2026-03 | Josué Rojas | Initial version (DCC-140) |
