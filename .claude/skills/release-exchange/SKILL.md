---
name: release-exchange
description: Release the exchange to testnet, stagenet, or mainnet through the Deploy Exchange workflow. Handles the ref that actually gets built, runs the pre-flight gate, dispatches, and watches the run to completion.
argument-hint: [testnet|stagenet|mainnet]
arguments: network
disable-model-invocation: true
allowed-tools: Bash(git status:*), Bash(git log:*), Bash(git rev-parse:*), Bash(git rev-list:*), Bash(git branch:*), Bash(git fetch:*), Bash(gh run list:*), Bash(gh run view:*), Bash(gh repo view:*), Bash(gh workflow list:*)
---

Release the exchange to **$network**.

If `$network` is empty or is not one of `testnet`, `stagenet`, `mainnet`, stop and
ask which one — never guess a deploy target.

## The trap this skill exists to prevent

`gh workflow run` dispatches against the **repository's default branch** unless
you pass `--ref`. This repo's default branch is `main`.

So the obvious command:

```bash
gh workflow run "Deploy Exchange" -f network=testnet   # ← builds main
```

deploys whatever is on `main` — **not** the branch you are working on. Every
past run of this workflow built `main`. If your work is on `dev`, that command
ships something else entirely and reports success while doing it.

**Always pass `--ref` explicitly.** Never dispatch without it.

## 1. Establish what would actually ship

```bash
git fetch origin --quiet
git branch --show-current
git status --porcelain
git rev-list --left-right --count origin/$(git branch --show-current)...$(git branch --show-current)
```

Report to the user, before doing anything:

- the branch you intend to deploy, and its short SHA
- whether the working tree is clean
- whether local is ahead of its remote — **unpushed commits will not deploy**,
  because the workflow builds from the pushed ref, not your disk

If local is ahead, say so and stop. Pushing is the user's call, not this
skill's.

## 2. Pre-flight the build locally

The workflow runs `pnpm nx run exchange:test` and fails the deploy on a red
suite, so a broken build cannot reach any environment. Running it locally first
just gets you the answer in one minute instead of ten.

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 24.18.0
cd apps/exchange
./node_modules/.bin/tsc -b --noEmit
./node_modules/.bin/vitest run
```

Read the **`Test Files`** line, not only the test count. Files that fail to
import contribute zero tests, so a green count can hide broken files.

If anything fails, stop and report. Do not deploy around a red gate.

## 3. Dispatch

### testnet and stagenet

These require `workflow_dispatch` — the workflow's `if:` condition blocks them
on any other trigger. **No merge to `main` is needed.** Deploy the branch you
are on:

```bash
gh workflow run "Deploy Exchange" \
  -f network=$network \
  --ref <branch> \
  --repo Decentral-America/DecentralChain
```

The Cloudflare Pages alias is pinned to `main` inside the workflow, which is the
CF *deployment slot*, not the git branch. Deploying `--ref dev` still publishes
to the live testnet URL. That is intended.

### mainnet

Mainnet is real money and a real audience. **Confirm with the user before
dispatching, every time**, and state which commit will ship.

Two routes exist:

**Versioned release (preferred).** A tag matching `exchange/v*.*.*` triggers the
workflow, and a tag push always resolves to `mainnet`:

```bash
git tag exchange/v1.2.3
git push origin exchange/v1.2.3
```

Tag a commit on `main`. The tag is the release record — it is what Sentry uses
as the release identifier, where a dispatch falls back to a bare commit SHA.

**Hotfix dispatch.** Same command as testnet with `network=mainnet`. Use it when
you need to ship without cutting a version.

**Should mainnet come from `main`?** Yes, in practice. Nothing in the workflow
enforces it — you *can* tag or dispatch a `dev` commit and it will deploy — but
`main` is the production lineage, and every deploy this workflow has ever run
built `main`. If the user asks to ship mainnet from another branch, say plainly
that it works but departs from that lineage, and let them decide.

## 4. Watch it

Deploys queue rather than cancel: `concurrency` is per network with
`cancel-in-progress: false`, so a second dispatch waits behind the first instead
of replacing it.

```bash
gh run list --workflow="Deploy Exchange" --repo Decentral-America/DecentralChain --limit 3
gh run watch <run-id> --repo Decentral-America/DecentralChain
```

Confirm from the run that **`headBranch` is the ref you intended**. That is the
single check that catches the default-branch trap after the fact.

## 5. Report

Give the user:

- network, the CF Pages project, and the exact commit deployed
- the run URL and its conclusion
- the live URL — `decentral.exchange` for mainnet, `<network>.decentral.exchange`
  otherwise

Testnet deploys additionally self-verify: the workflow fetches the live page,
extracts the first hashed asset it references, and confirms that asset resolves.
That catches Cloudflare serving stale HTML pointing at a garbage-collected
bundle — a blank page that a plain 200 check would call healthy. If that step
fails after its retry, the deploy is genuinely broken; say so rather than
reporting success.

## If the deploy fails

Read the failing step before rerunning. Common causes, in the order they appear:

| Step | Usually means |
|---|---|
| `Test exchange` | A real regression. Fix it; do not rerun hoping. |
| `Build exchange` | A missing env var for that mode, or a `tsc` project-reference error |
| `Check Cloudflare secrets` | `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` unset — the deploy **skips silently** and the run still goes green |
| `Verify production URL` | CF production alias drift, or a connected git integration racing the wrangler upload |

That third row is worth internalising: an unconfigured Cloudflare secret does
not fail the run. It logs a notice, skips the deploy, and reports success. If a
release "succeeded" but nothing changed on the site, check that step first.
