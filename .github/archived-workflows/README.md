# Archived workflows

These were superseded/dead workflows, moved out of `.github/workflows/` (GitHub Actions only
scans that directory directly, not subdirectories, so these no longer run or appear in the
Actions tab — content and history are preserved, not deleted). Same convention as
`infra/.github/archived-workflows/`.

Archived 2026-09-21, following a full 89-workflow audit across all 5 Decentral-America repos:

| Workflow | Last run before archiving | Why |
|---|---|---|
| `stress-test.yml` | 2026-06-30 | Superseded ancestor of `infra/.github/workflows/stress-test.yml`, which the admin dashboard's "Run Stress Test" button actually calls (via `correlation_id`, JSONL output for the TPS chart). This copy has neither and nothing dispatches it. **Do not confuse with the infra copy — that one is live, keep it.** |
| `list-senders.yml` | 2026-06-30 | Debug print of load-test sender addresses, obtainable directly via the `load-tester --list-senders` CLI flag locally; not worth a 25-minute Rust CI build for. |

If either is needed again, move the file back to `.github/workflows/` — nothing else to
restore.
