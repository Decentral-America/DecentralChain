import {
  AlertCircle,
  CheckCircle,
  Circle,
  Clock,
  ExternalLink,
  GitBranch,
  Loader,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  type RepoCiStatus,
  type WorkflowConclusion,
  type WorkflowRun,
} from '@/routes/api.cicd.status';

// ── Helpers ───────────────────────────────────────────────────────────────────

function conclusionIcon(status: string, conclusion: WorkflowConclusion): React.ReactNode {
  if (status === 'in_progress' || status === 'queued') {
    return <Loader className="h-4 w-4 animate-spin text-blue-500" />;
  }
  switch (conclusion) {
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failure':
    case 'timed_out':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'cancelled':
      return <Circle className="h-4 w-4 text-muted-foreground" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

function conclusionBadgeVariant(
  conclusion: WorkflowConclusion,
): 'default' | 'destructive' | 'secondary' | 'outline' {
  switch (conclusion) {
    case 'success':
      return 'default';
    case 'failure':
    case 'timed_out':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function formatDuration(ms: number): string {
  if (ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Group workflow runs into logical categories
function categorize(runs: WorkflowRun[]): Map<string, WorkflowRun[]> {
  const groups = new Map<string, WorkflowRun[]>();

  const add = (group: string, run: WorkflowRun) => {
    const existing = groups.get(group) ?? [];
    existing.push(run);
    groups.set(group, existing);
  };

  for (const run of runs) {
    const f = run.workflowFile.toLowerCase();
    if (f.includes('deploy')) add('Deploy', run);
    else if (
      f === 'ci.yml' ||
      f === 'integration.yml' ||
      f === 'bps.yml' ||
      f === 'websocket-api.yml' ||
      f === 'check-pr.yaml'
    )
      add('CI', run);
    else if (
      f.includes('security') ||
      f.includes('codeql') ||
      f.includes('semgrep') ||
      f.includes('owasp') ||
      f.includes('trivy')
    )
      add('Security', run);
    else if (
      f.includes('publish') ||
      f.includes('release') ||
      f.includes('on-push') ||
      f.includes('on-release')
    )
      add('Publish', run);
    else if (
      f.includes('provision') ||
      f.includes('drift') ||
      f.includes('ghcr') ||
      f.includes('push-secrets') ||
      f.includes('bootstrap') ||
      f.includes('cluster') ||
      f.includes('export') ||
      f.includes('caddy') ||
      f.includes('redis') ||
      f.includes('flux')
    )
      add('Infra', run);
    else add('Other', run);
  }

  // Preferred display order
  const ORDER = ['Deploy', 'CI', 'Security', 'Publish', 'Infra', 'Other'];
  const sorted = new Map<string, WorkflowRun[]>();
  for (const key of ORDER) {
    const val = groups.get(key);
    if (val) sorted.set(key, val);
  }
  for (const [k, v] of groups) {
    if (!sorted.has(k)) sorted.set(k, v);
  }
  return sorted;
}

function repoShortName(repo: string): string {
  return repo.split('/')[1] ?? repo;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CiCd() {
  const [repos, setRepos] = useState<RepoCiStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ci-cd/status');
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { repos: RepoCiStatus[] };
      setRepos(data.repos);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const allRuns = repos.flatMap((r) => r.runs);
  const failingCount = allRuns.filter(
    (r) => r.conclusion === 'failure' || r.conclusion === 'timed_out',
  ).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">CI/CD Status</h1>
          {!loading && failingCount > 0 && (
            <Badge variant="destructive">{failingCount} failing</Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-muted-foreground">
              Updated {relativeTime(lastRefresh.toISOString())}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <strong>Failed to load CI/CD status.</strong>
            <br />
            {error}
            {error.includes('GITHUB_ADMIN_PAT') && (
              <p className="mt-2 text-xs text-muted-foreground">
                Add <code className="font-mono bg-muted px-1 rounded">GITHUB_ADMIN_PAT</code> to{' '}
                <code className="font-mono bg-muted px-1 rounded">infra/secrets/testnet.env</code>{' '}
                via SOPS. A GitHub fine-grained PAT with{' '}
                <code className="font-mono bg-muted px-1 rounded">Actions: Read</code> on all{' '}
                <code className="font-mono bg-muted px-1 rounded">Decentral-America</code> repos is
                sufficient.
              </p>
            )}
          </div>
        </div>
      )}

      {loading && repos.length === 0 ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((__, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                    <Skeleton key={j} className="h-8 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {repos.map((repoStatus) => {
            const groups = categorize(repoStatus.runs);
            const repoName = repoShortName(repoStatus.repo);

            return (
              <div key={repoStatus.repo}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="text-base font-semibold">{repoName}</h2>
                  <a
                    href={`https://github.com/${repoStatus.repo}/actions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    GitHub Actions <ExternalLink className="h-3 w-3" />
                  </a>
                  {repoStatus.fetchError && (
                    <Badge variant="destructive" className="text-xs">
                      {repoStatus.fetchError}
                    </Badge>
                  )}
                </div>

                <div className="space-y-3">
                  {[...groups.entries()].map(([groupName, runs]) => (
                    <Card key={groupName}>
                      <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          {groupName}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 pb-3">
                        <div className="space-y-1">
                          {runs
                            .sort(
                              (a, b) =>
                                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                            )
                            .map((run) => (
                              <a
                                key={run.id}
                                href={run.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50 transition-colors group"
                              >
                                <span className="shrink-0">
                                  {conclusionIcon(run.status, run.conclusion)}
                                </span>

                                <span className="flex-1 font-medium truncate">{run.name}</span>

                                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                  <GitBranch className="h-3 w-3" />
                                  {run.branch}
                                </span>

                                <Badge
                                  variant={conclusionBadgeVariant(run.conclusion)}
                                  className="font-mono text-xs shrink-0"
                                >
                                  {run.status === 'in_progress'
                                    ? 'running'
                                    : (run.conclusion ?? run.status)}
                                </Badge>

                                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 w-14 justify-end">
                                  <Clock className="h-3 w-3" />
                                  {formatDuration(run.durationMs)}
                                </span>

                                <span className="text-xs text-muted-foreground shrink-0 w-20 text-right">
                                  {relativeTime(run.updatedAt)}
                                </span>

                                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0" />
                              </a>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
