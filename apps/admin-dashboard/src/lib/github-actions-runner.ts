import { unzipSync } from 'fflate';
import { logger } from './logger';

// ── Why this exists ──────────────────────────────────────────────────────────
//
// E2E and stress-test execution do NOT happen inside this container. They run
// as GitHub Actions workflows in an isolated, ephemeral runner that pulls its
// own scoped secrets (funded test seed, rate-limit bypass key) directly from
// GitHub Actions secrets — this process never sees them. This module is the
// thin control-plane client: dispatch a run, poll its status politely (ETags,
// serial requests, no tight loops), and fetch the results artifact once it's done.
//
// GitHub's workflow_dispatch API does not return a run id synchronously, so we
// tag every dispatch with a `correlation_id` input and locate the resulting
// run by matching `run-name` (each caller workflow templates run-name from
// that input) — the standard workaround for this well-known API gap.

const GITHUB_API = 'https://api.github.com';

export interface DispatchTarget {
  owner: string;
  repo: string;
  workflowFile: string;
  ref: string;
}

export type RunStatus = 'queued' | 'in_progress' | 'completed';
export type RunConclusion =
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'timed_out'
  | 'action_required'
  | 'neutral'
  | 'skipped'
  | null;

export interface RunState {
  runId: number;
  status: RunStatus;
  conclusion: RunConclusion;
  htmlUrl: string;
  etag: string | null;
}

// Same token used by api.cicd.status.ts — it now has Actions:write in
// addition to the read access that route relies on, so it doubles as the
// dispatch/poll/artifact credential for this module too.
function getToken(): string {
  const token = process.env.ADMIN_DASHBOARD_GITHUB_PAT;
  if (!token) {
    throw new Error(
      'ADMIN_DASHBOARD_GITHUB_PAT is not configured — add it to infra/secrets/testnet.env via SOPS',
    );
  }
  return token;
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${getToken()}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
}

async function githubFetch(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...init?.headers },
    signal: AbortSignal.timeout(15_000),
  });

  // Secondary rate limit: back off exactly as long as GitHub tells us to.
  if (res.status === 403 || res.status === 429) {
    const retryAfter = res.headers.get('retry-after');
    if (retryAfter) {
      const waitMs = Number(retryAfter) * 1000;
      logger.warn({ path, waitMs }, 'GitHub API secondary rate limit — backing off');
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      return githubFetch(path, init);
    }
  }
  return res;
}

/** Dispatch a workflow_dispatch run tagged with a correlation id for later lookup. */
export async function dispatchWorkflow(
  target: DispatchTarget,
  correlationId: string,
  inputs: Record<string, string>,
): Promise<void> {
  const res = await githubFetch(
    `/repos/${target.owner}/${target.repo}/actions/workflows/${target.workflowFile}/dispatches`,
    {
      body: JSON.stringify({
        inputs: { ...inputs, correlation_id: correlationId },
        ref: target.ref,
      }),
      method: 'POST',
    },
  );
  if (!res.ok) {
    throw new Error(`workflow_dispatch failed: HTTP ${res.status} ${await res.text()}`);
  }
}

/**
 * Locate the run created by a dispatch, by matching its templated run-name
 * against the correlation id. Retries briefly — GitHub takes a moment to
 * surface a freshly-dispatched run in the list-runs API.
 */
export async function resolveDispatchedRun(
  target: DispatchTarget,
  correlationId: string,
  maxAttempts = 8,
): Promise<RunState> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 2_000));

    const res = await githubFetch(
      `/repos/${target.owner}/${target.repo}/actions/workflows/${target.workflowFile}/runs?event=workflow_dispatch&per_page=15`,
    );
    if (!res.ok) continue;

    const data = (await res.json()) as {
      workflow_runs: Array<{
        id: number;
        name: string;
        status: string;
        conclusion: string | null;
        html_url: string;
      }>;
    };
    const match = data.workflow_runs.find((r) => r.name.includes(correlationId));
    if (match) {
      return {
        conclusion: match.conclusion as RunConclusion,
        etag: null,
        htmlUrl: match.html_url,
        runId: match.id,
        status: match.status as RunStatus,
      };
    }
  }
  throw new Error('Timed out waiting for the dispatched run to appear in GitHub Actions');
}

/** Poll a single run's status. Pass the previous etag to get a free 304 when nothing changed. */
export async function pollRunStatus(
  target: DispatchTarget,
  runId: number,
  previousEtag: string | null,
): Promise<RunState | 'unchanged'> {
  const res = await githubFetch(`/repos/${target.owner}/${target.repo}/actions/runs/${runId}`, {
    headers: previousEtag ? { 'If-None-Match': previousEtag } : {},
  });
  if (res.status === 304) return 'unchanged';
  if (!res.ok) throw new Error(`Failed to poll run ${runId}: HTTP ${res.status}`);

  const data = (await res.json()) as {
    status: string;
    conclusion: string | null;
    html_url: string;
  };
  return {
    conclusion: data.conclusion as RunConclusion,
    etag: res.headers.get('etag'),
    htmlUrl: data.html_url,
    runId,
    status: data.status as RunStatus,
  };
}

export async function cancelRun(target: DispatchTarget, runId: number): Promise<void> {
  await githubFetch(`/repos/${target.owner}/${target.repo}/actions/runs/${runId}/cancel`, {
    method: 'POST',
  });
}

/**
 * Download a run's artifact and return the named entry's raw bytes.
 * GitHub only serves artifacts for COMPLETED runs — call this after status
 * transitions to 'completed', not before (in-progress logs/artifacts are not
 * available via the API; this is a hard GitHub API limitation, not a bug here).
 */
export async function downloadArtifactFile(
  target: DispatchTarget,
  runId: number,
  artifactNamePrefix: string,
  entryName: string,
): Promise<Uint8Array | null> {
  const listRes = await githubFetch(
    `/repos/${target.owner}/${target.repo}/actions/runs/${runId}/artifacts`,
  );
  if (!listRes.ok)
    throw new Error(`Failed to list artifacts for run ${runId}: HTTP ${listRes.status}`);

  const list = (await listRes.json()) as { artifacts: Array<{ id: number; name: string }> };
  const artifact = list.artifacts.find((a) => a.name.startsWith(artifactNamePrefix));
  if (!artifact) return null;

  const zipRes = await githubFetch(
    `/repos/${target.owner}/${target.repo}/actions/artifacts/${artifact.id}/zip`,
  );
  if (!zipRes.ok)
    throw new Error(`Failed to download artifact ${artifact.id}: HTTP ${zipRes.status}`);

  const zipBytes = new Uint8Array(await zipRes.arrayBuffer());
  const files = unzipSync(zipBytes);
  return files[entryName] ?? null;
}
