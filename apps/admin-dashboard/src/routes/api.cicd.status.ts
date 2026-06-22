import { type LoaderFunctionArgs } from 'react-router';
import { getTokenFromRequest, verifyToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

async function getUser(request: Request): Promise<string | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.username ?? null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type WorkflowConclusion =
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'skipped'
  | 'timed_out'
  | 'action_required'
  | 'neutral'
  | null;

export interface WorkflowRun {
  id: number;
  name: string;
  workflowFile: string;
  branch: string;
  status: string;
  conclusion: WorkflowConclusion;
  runNumber: number;
  createdAt: string;
  updatedAt: string;
  url: string;
  repo: string;
  durationMs: number;
}

export interface RepoCiStatus {
  repo: string;
  runs: WorkflowRun[];
  fetchError?: string;
}

// ── GitHub API ────────────────────────────────────────────────────────────────

const REPOS = [
  'Decentral-America/DecentralChain',
  'Decentral-America/infra',
  'Decentral-America/node-scala',
  'Decentral-America/matcher',
];

// Workflows that are noisy/administrative — hide unless they failed recently
const HIDDEN_WORKFLOWS = new Set([
  'dependabot-updates',
  'fix-bps-env',
  'verify-fixes',
  'set-redis-policy',
  'publish-aptly-repo',
]);

interface GithubRunRaw {
  id: number;
  name: string;
  path: string;
  head_branch: string;
  status: string;
  conclusion: string | null;
  run_number: number;
  created_at: string;
  updated_at: string;
  html_url: string;
  workflow_id: number;
}

async function fetchRepoRuns(repo: string, token: string): Promise<WorkflowRun[]> {
  // Fetch the 50 most recent runs. Deduplicate to get the latest run per workflow name.
  const url = `https://api.github.com/repos/${repo}/actions/runs?per_page=100`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${repo}`);
  }

  const data = (await res.json()) as { workflow_runs: GithubRunRaw[] };

  // Deduplicate: keep only the most recent run per workflow name
  const seen = new Map<string, GithubRunRaw>();
  for (const run of data.workflow_runs) {
    const filename =
      run.path?.split('/').pop()?.replace('.yml', '').replace('.yaml', '') ?? run.name;
    if (HIDDEN_WORKFLOWS.has(filename) && run.conclusion !== 'failure') continue;
    if (!seen.has(run.name)) seen.set(run.name, run);
  }

  return [...seen.values()].map((run) => {
    const durationMs =
      run.updated_at && run.created_at
        ? new Date(run.updated_at).getTime() - new Date(run.created_at).getTime()
        : 0;
    return {
      branch: run.head_branch,
      conclusion: run.conclusion as WorkflowConclusion,
      createdAt: run.created_at,
      durationMs,
      id: run.id,
      name: run.name,
      repo,
      runNumber: run.run_number,
      status: run.status,
      updatedAt: run.updated_at,
      url: run.html_url,
      workflowFile: run.path?.split('/').pop() ?? '',
    };
  });
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await getUser(request);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const token = process.env.GITHUB_ADMIN_PAT;
  if (!token) {
    return Response.json(
      {
        error: 'GITHUB_ADMIN_PAT is not configured. Add it to infra/secrets/testnet.env via SOPS.',
      },
      { status: 503 },
    );
  }

  const results = await Promise.allSettled(REPOS.map((repo) => fetchRepoRuns(repo, token)));

  const repoStatuses: RepoCiStatus[] = REPOS.map((repo, i) => {
    const result = results[i];
    if (!result) return { fetchError: 'missing result', repo, runs: [] };
    if (result.status === 'fulfilled') {
      return { repo, runs: result.value };
    }
    const message = result.reason instanceof Error ? result.reason.message : 'fetch failed';
    logger.warn({ message, repo }, 'CI/CD status: failed to fetch repo runs');
    return { fetchError: message, repo, runs: [] };
  });

  return Response.json({ repos: repoStatuses });
}
