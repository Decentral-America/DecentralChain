# Cubensis Connect — Release Runbook

This runbook covers the full release process: quality gates, platform builds,
store submission, post-release verification, and rollback procedures.

---

## Pre-flight Checklist

Before cutting a release, every item below must be green:

- [ ] `pnpm run ci:check` passes (lint + typecheck + unit tests + manifest validation)
- [ ] Nightly E2E workflow passed on the release candidate branch
- [ ] CHANGELOG.md is up to date with all significant changes
- [ ] `nx release version` has been run and the version bump committed
- [ ] No open P1/P2 security issues in the Jira backlog for this epic
- [ ] `docs/SECURITY-AUDIT.md` entries for this release are resolved or deferred with notes

---

## Step 1 — Run Quality Gates

```bash
cd apps/cubensis-connect

# Combined gate: lint + typecheck + unit tests + manifest validation
pnpm run ci:check
```

All four sub-commands must exit 0. If `node scripts/validate-manifest.mjs` fails
with `use_dynamic_url` errors, the build artifacts are stale — proceed to Step 2
to rebuild, then re-run `ci:check`.

---

## Step 2 — Platform Builds

Build all four platform targets from a clean state. Set `CUBENSIS_VERSION` to the
version from `manifest.json` or the current `nx release` tag (e.g. `1.2.3`).

```bash
cd apps/cubensis-connect

# Chrome (MV3)
CUBENSIS_PLATFORM=chrome NODE_ENV=production node scripts/build.mjs

# Edge (MV3 — same manifest as Chrome)
CUBENSIS_PLATFORM=edge NODE_ENV=production node scripts/build.mjs

# Firefox (MV2)
CUBENSIS_PLATFORM=firefox NODE_ENV=production node scripts/build.mjs

# Opera (MV2)
CUBENSIS_PLATFORM=opera NODE_ENV=production node scripts/build.mjs
```

Output directories after build:

| Platform | Output directory            | Manifest version |
|----------|-----------------------------|-----------------|
| Chrome   | `dist/chrome/`              | MV3             |
| Edge     | `dist/edge/`                | MV3             |
| Firefox  | `dist/firefox/`             | MV2             |
| Opera    | `dist/opera/`               | MV2             |

Re-run the manifest validator to confirm all four builds are clean:

```bash
node scripts/validate-manifest.mjs
```

---

## Step 3 — Package Extension Zips

```bash
cd apps/cubensis-connect

VERSION=$(node -e "const m=JSON.parse(require('fs').readFileSync('dist/chrome/manifest.json','utf8')); console.log(m.version)")

zip -r "cubensis-connect-chrome-${VERSION}.zip"  dist/chrome/
zip -r "cubensis-connect-edge-${VERSION}.zip"    dist/edge/
zip -r "cubensis-connect-firefox-${VERSION}.zip" dist/firefox/
zip -r "cubensis-connect-opera-${VERSION}.zip"   dist/opera/
```

Verify zip contents spot-check at least one:

```bash
unzip -l "cubensis-connect-chrome-${VERSION}.zip" | grep -E 'manifest|background|popup'
```

---

## Step 4 — Store Submission

Submit zips to each store in the order below. Allow 24–72 hours for review
depending on the store. Do not mark the Jira release ticket as Done until all
stores have approved.

### 4.1 Chrome Web Store

1. Navigate to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Select **Cubensis Connect** → **Package** → **Upload new package**
3. Upload `cubensis-connect-chrome-<VERSION>.zip`
4. Update the store listing "What's new" field with the CHANGELOG entry
5. Click **Submit for review**
6. Note the submission ID in the Jira release comment

### 4.2 Microsoft Edge Add-ons

1. Navigate to the [Edge Partner Center](https://partner.microsoft.com/en-us/dashboard/microsoftedge/overview)
2. Select **Cubensis Connect** → **Update** → upload `cubensis-connect-edge-<VERSION>.zip`
3. Confirm the "Certification notes" match the Chrome submission notes
4. Click **Publish**

### 4.3 Firefox Add-ons (AMO)

1. Navigate to [addons.mozilla.org/developers/](https://addons.mozilla.org/developers/)
2. Select **Cubensis Connect** → **Upload New Version**
3. Upload `cubensis-connect-firefox-<VERSION>.zip`
4. Firefox requires source code submission for obfuscation review — zip the repo
   source and upload when prompted: `git archive HEAD --format=zip > source-${VERSION}.zip`
5. Complete the compatibility questionnaire
6. Submit

### 4.4 Opera Add-ons

1. Navigate to the [Opera Developer Portal](https://addons.opera.com/developer/)
2. Select **Cubensis Connect** → **Add version**
3. Upload `cubensis-connect-opera-<VERSION>.zip`
4. Submit for review

---

## Step 5 — Post-Release Verification

After at least one store (Chrome) has approved and the extension is live:

### Sentry Release Check

```bash
# Verify the release tag is visible in Sentry
# Replace <ORG> and <VERSION> with real values
curl -s "https://sentry.io/api/0/organizations/<ORG>/releases/${VERSION}/" \
  -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" | jq '.version,.dateReleased'
```

Expected output: the version string and a non-null `dateReleased` timestamp.

If missing, create the Sentry release manually or redeploy with `SENTRY_RELEASE`
env var set.

### Smoke Test (Manual)

1. Install the Chrome `.zip` as an unpacked extension in a clean Chrome profile
2. Create a new wallet (seed phrase flow)
3. Verify signing a transfer transaction completes without errors
4. Check the browser console — no uncaught exceptions

---

## Rollback Criteria

Pause or unpublish the release immediately if **any** of the following occur within
48 hours of going live:

| Signal | Threshold | Action |
|--------|-----------|--------|
| Crash rate (Sentry) | ≥ 1% of sessions | Unpublish all stores |
| Security vulnerability report | Any CVSS ≥ 7.0 | Unpublish + hotfix |
| Vault data loss reports | ≥ 1 confirmed report | Unpublish immediately |
| CSP violation spike | > 100 violations / hour | Investigate, unpublish if exploitable |

### Unpublish Procedure

1. Chrome: Developer Dashboard → **Unpublish**
2. Edge: Partner Center → **Unpublish**
3. Firefox: AMO → **Disable version**
4. Opera: Developer Portal → **Deactivate**
5. Open a P1 Jira issue referencing the affected version
6. Alert the team in the `#cubensis-connect` channel

### Hotfix Branch

```bash
git checkout -b fix/DCC-XXX-hotfix-description <release-tag>
# apply fix, run ci:check, get review
# cherry-pick onto main after confirmation
```

---

## Environment Variables (CI)

| Variable | Purpose | Required for |
|----------|---------|-------------|
| `CUBENSIS_PLATFORM` | `chrome` \| `edge` \| `firefox` \| `opera` | Platform build step |
| `NODE_ENV` | `production` for release builds | All release builds |
| `SENTRY_AUTH_TOKEN` | Sentry API authentication | Post-release Sentry check |
| `SENTRY_ORG` | Sentry organization slug | Post-release Sentry check |

---

## References

- DCC-122 epic: Production Readiness & Security Hardening
- DCC-124: CSP hardening + `use_dynamic_url` (`adaptManifestToPlatform.js`)
- DCC-125: Sentry error capture + vault lock-to-reject (`background.ts`)
- DCC-128: `scripts/validate-manifest.mjs` manifest quality gate
- [Nightly E2E workflow](../../.github/workflows/cubensis-nightly-e2e.yml)
