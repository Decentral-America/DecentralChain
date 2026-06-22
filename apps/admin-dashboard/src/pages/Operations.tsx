import { AlertCircle, Archive, ExternalLink, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useRouteLoaderData } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { type BackupStatus } from '@/routes/api.backups.status';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NpmPackage {
  name: string;
  version: string;
  description?: string;
}

interface MavenArtifact {
  group: string;
  artifact: string;
  latestVersion: string;
  timestamp: number;
}

interface SentryIssue {
  id: string;
  title: string;
  project: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

interface CodecovRepo {
  name: string;
  coverage: number;
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function fetchNpmPackages(): Promise<NpmPackage[]> {
  const packages = [
    '@decentralchain/transactions',
    '@decentralchain/ts-lib-crypto',
    '@decentralchain/types',
    '@decentralchain/marshall',
    '@decentralchain/node-api',
    '@decentralchain/data-service-client',
    '@decentralchain/signer',
  ];

  const results = await Promise.allSettled(
    packages.map((pkg) =>
      fetch(`https://registry.npmjs.org/${encodeURIComponent(pkg)}/latest`, {
        signal: AbortSignal.timeout(10_000),
      }).then((r) => r.json() as Promise<{ name: string; version: string; description?: string }>),
    ),
  );

  return results.map((r, i) => {
    if (r.status === 'fulfilled') {
      return { description: r.value.description, name: r.value.name, version: r.value.version };
    }
    return { name: packages[i] ?? `package-${i}`, version: 'error' };
  });
}

async function fetchMavenArtifacts(): Promise<MavenArtifact[]> {
  const res = await fetch(
    'https://search.maven.org/solrsearch/select?q=g:io.github.decentral-america&rows=20&wt=json',
    { signal: AbortSignal.timeout(10_000) },
  );
  if (!res.ok) throw new Error(`Maven search HTTP ${res.status}`);
  const data = (await res.json()) as {
    response: {
      docs: Array<{ g: string; a: string; latestVersion: string; timestamp: number }>;
    };
  };
  return data.response.docs.map((d) => ({
    artifact: d.a,
    group: d.g,
    latestVersion: d.latestVersion,
    timestamp: d.timestamp,
  }));
}

async function fetchSentryIssues(authToken: string): Promise<SentryIssue[]> {
  const res = await fetch(
    'https://sentry.io/api/0/organizations/decentral-america/issues/?limit=10&query=is:unresolved',
    {
      headers: { Authorization: `Bearer ${authToken}` },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!res.ok) throw new Error(`Sentry API HTTP ${res.status}`);
  const data = (await res.json()) as Array<{
    id: string;
    title: string;
    project: { slug: string };
    count: string;
    firstSeen: string;
    lastSeen: string;
  }>;
  return data.map((issue) => ({
    count: Number(issue.count),
    firstSeen: issue.firstSeen,
    id: issue.id,
    lastSeen: issue.lastSeen,
    project: issue.project.slug,
    title: issue.title,
  }));
}

async function fetchCodecovRepos(): Promise<CodecovRepo[]> {
  const repos = ['DecentralChain'];
  const results = await Promise.allSettled(
    repos.map((repo) =>
      fetch(`https://codecov.io/api/v2/github/Decentral-America/repos/${repo}/`, {
        signal: AbortSignal.timeout(10_000),
      }).then(
        (r) =>
          r.json() as Promise<{
            name: string;
            totals?: { coverage: number };
          }>,
      ),
    ),
  );
  return results.flatMap((r) => {
    if (r.status === 'fulfilled' && r.value.totals) {
      return [{ coverage: r.value.totals.coverage, name: r.value.name }];
    }
    return [];
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Operations() {
  const root = useRouteLoaderData('root') as
    | { grafanaUrl?: string; sentryAuthToken?: string }
    | undefined;
  const grafanaUrl = root?.grafanaUrl ?? '';

  const [npmPackages, setNpmPackages] = useState<NpmPackage[] | null>(null);
  const [npmLoading, setNpmLoading] = useState(false);
  const [npmError, setNpmError] = useState<string | null>(null);

  const [mavenArtifacts, setMavenArtifacts] = useState<MavenArtifact[] | null>(null);
  const [mavenLoading, setMavenLoading] = useState(false);
  const [mavenError, setMavenError] = useState<string | null>(null);

  const [sentryIssues, setSentryIssues] = useState<SentryIssue[] | null>(null);
  const [sentryLoading, setSentryLoading] = useState(false);
  const [sentryError, setSentryError] = useState<string | null>(null);

  const [codecovRepos, setCodecovRepos] = useState<CodecovRepo[] | null>(null);
  const [codecovLoading, setCodecovLoading] = useState(false);
  const [codecovError, setCodecovError] = useState<string | null>(null);

  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [backupLoading, setBackupLoading] = useState(false);

  const loadNpm = useCallback(async () => {
    setNpmLoading(true);
    setNpmError(null);
    try {
      setNpmPackages(await fetchNpmPackages());
    } catch (err) {
      setNpmError(err instanceof Error ? err.message : String(err));
    } finally {
      setNpmLoading(false);
    }
  }, []);

  const loadMaven = useCallback(async () => {
    setMavenLoading(true);
    setMavenError(null);
    try {
      setMavenArtifacts(await fetchMavenArtifacts());
    } catch (err) {
      setMavenError(err instanceof Error ? err.message : String(err));
    } finally {
      setMavenLoading(false);
    }
  }, []);

  const loadSentry = useCallback(async () => {
    const token = root?.sentryAuthToken;
    if (!token) {
      setSentryError('SENTRY_AUTH_TOKEN not configured');
      return;
    }
    setSentryLoading(true);
    setSentryError(null);
    try {
      setSentryIssues(await fetchSentryIssues(token));
    } catch (err) {
      setSentryError(err instanceof Error ? err.message : String(err));
    } finally {
      setSentryLoading(false);
    }
  }, [root?.sentryAuthToken]);

  const loadCodecov = useCallback(async () => {
    setCodecovLoading(true);
    setCodecovError(null);
    try {
      setCodecovRepos(await fetchCodecovRepos());
    } catch (err) {
      setCodecovError(err instanceof Error ? err.message : String(err));
    } finally {
      setCodecovLoading(false);
    }
  }, []);

  const loadBackups = useCallback(async () => {
    setBackupLoading(true);
    try {
      const res = await fetch('/api/backups/status');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBackupStatus((await res.json()) as BackupStatus);
    } catch {
      // Errors are surfaced through backupStatus.fetchError
    } finally {
      setBackupLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNpm();
    void loadMaven();
    void loadSentry();
    void loadCodecov();
    void loadBackups();
  }, [loadNpm, loadMaven, loadSentry, loadCodecov, loadBackups]);

  // nxCloudId from nx.json — workspace identifier on cloud.nx.app
  const NX_CLOUD_WORKSPACE_ID = '6a07a03e8a73063a9eda9bf3';

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Operations</h1>

      {/* NX Cloud */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>NX Cloud — Remote Cache &amp; CI Analytics</span>
            <a
              href={`https://cloud.nx.app/orgs/workspace-${NX_CLOUD_WORKSPACE_ID}/workspaces/${NX_CLOUD_WORKSPACE_ID}/overview`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Open NX Cloud <ExternalLink className="h-3 w-3" />
            </a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <a
              href={`https://cloud.nx.app/orgs/workspace-${NX_CLOUD_WORKSPACE_ID}/workspaces/${NX_CLOUD_WORKSPACE_ID}/runs`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border p-4 hover:bg-accent/30 transition-colors"
            >
              <p className="text-xs text-muted-foreground mb-1">CI Runs</p>
              <p className="font-medium">View run history →</p>
            </a>
            <a
              href={`https://cloud.nx.app/orgs/workspace-${NX_CLOUD_WORKSPACE_ID}/workspaces/${NX_CLOUD_WORKSPACE_ID}/cache`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border p-4 hover:bg-accent/30 transition-colors"
            >
              <p className="text-xs text-muted-foreground mb-1">Remote Cache</p>
              <p className="font-medium">Cache analytics →</p>
            </a>
            <a
              href={`https://cloud.nx.app/orgs/workspace-${NX_CLOUD_WORKSPACE_ID}/workspaces/${NX_CLOUD_WORKSPACE_ID}/tasks`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-border p-4 hover:bg-accent/30 transition-colors"
            >
              <p className="text-xs text-muted-foreground mb-1">Task Timings</p>
              <p className="font-medium">Performance insights →</p>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Grafana */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Grafana Monitoring</span>
            {grafanaUrl && (
              <a
                href={grafanaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                Open full dashboard <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {grafanaUrl ? (
            <div className="rounded-md overflow-hidden border border-border h-[480px]">
              <iframe
                title="Grafana monitoring"
                src={`${grafanaUrl}/d/testnet?orgId=1&refresh=30s&kiosk`}
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-popups"
              />
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Set <code className="font-mono text-xs bg-muted px-1 rounded">GRAFANA_URL</code> to
              embed the dashboard.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4" />
              <span>R2 Backups</span>
            </div>
            <Button variant="ghost" size="icon" onClick={loadBackups} disabled={backupLoading}>
              <RefreshCw className={`h-4 w-4 ${backupLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {backupLoading && !backupStatus ? (
            <Skeleton className="h-16 w-full" />
          ) : backupStatus?.fetchError ? (
            <div className="flex items-start gap-2 text-muted-foreground text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-yellow-500" />
              <div>
                <p>Backups not configured or unreachable.</p>
                <p className="text-xs mt-1 font-mono">{backupStatus.fetchError}</p>
              </div>
            </div>
          ) : backupStatus ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Bucket</p>
                <p className="font-mono text-sm font-medium">{backupStatus.bucket}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last Backup</p>
                <p className="font-medium">
                  {backupStatus.lastBackup
                    ? new Date(backupStatus.lastBackup.lastModified).toLocaleString()
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Latest File</p>
                <p
                  className="font-mono text-xs truncate"
                  title={backupStatus.lastBackup?.key ?? ''}
                >
                  {backupStatus.lastBackup?.key.split('/').pop() ?? '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total / Size</p>
                <p className="font-mono text-sm">
                  {backupStatus.totalFiles} files / {(backupStatus.totalSizeBytes / 1e9).toFixed(2)}{' '}
                  GB
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Sentry */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Sentry — Recent Unresolved Issues</span>
            <Button variant="ghost" size="icon" onClick={loadSentry} disabled={sentryLoading}>
              <RefreshCw className={`h-4 w-4 ${sentryLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Events</TableHead>
                  <TableHead className="hidden sm:table-cell">Last seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sentryLoading || sentryIssues === null ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder rows have no stable identity
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : sentryError ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {sentryError}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sentryIssues.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground text-sm py-4"
                    >
                      No unresolved issues.
                    </TableCell>
                  </TableRow>
                ) : (
                  sentryIssues.map((issue) => (
                    <TableRow key={issue.id}>
                      <TableCell className="text-sm max-w-xs truncate" title={issue.title}>
                        {issue.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {issue.project}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {issue.count.toLocaleString()}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(issue.lastSeen).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Codecov */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Codecov — Coverage</span>
            <Button variant="ghost" size="icon" onClick={loadCodecov} disabled={codecovLoading}>
              <RefreshCw className={`h-4 w-4 ${codecovLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {codecovLoading || codecovRepos === null ? (
            <Skeleton className="h-8 w-full" />
          ) : codecovError ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <AlertCircle className="h-4 w-4" />
              {codecovError}
            </div>
          ) : codecovRepos.length === 0 ? (
            <p className="text-muted-foreground text-sm">No coverage data available.</p>
          ) : (
            <div className="space-y-3">
              {codecovRepos.map((repo) => (
                <div key={repo.name} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-40 truncate">{repo.name}</span>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${repo.coverage >= 80 ? 'bg-green-500' : repo.coverage >= 50 ? 'bg-yellow-500' : 'bg-destructive'}`}
                      style={{ width: `${repo.coverage}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono w-12 text-right">
                    {repo.coverage.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* NPM packages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>NPM — @decentralchain/* Latest</span>
            <Button variant="ghost" size="icon" onClick={loadNpm} disabled={npmLoading}>
              <RefreshCw className={`h-4 w-4 ${npmLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Latest Version</TableHead>
                  <TableHead className="hidden sm:table-cell">Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {npmLoading || npmPackages === null ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder rows have no stable identity
                    <TableRow key={i}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : npmError ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-destructive text-sm py-4">
                      {npmError}
                    </TableCell>
                  </TableRow>
                ) : (
                  npmPackages.map((pkg) => (
                    <TableRow key={pkg.name}>
                      <TableCell>
                        <a
                          href={`https://www.npmjs.com/package/${encodeURIComponent(pkg.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {pkg.name}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={pkg.version === 'error' ? 'destructive' : 'secondary'}
                          className="font-mono text-xs"
                        >
                          {pkg.version}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground truncate max-w-xs">
                        {pkg.description ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Maven Central */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Maven Central — io.github.decentral-america</span>
            <Button variant="ghost" size="icon" onClick={loadMaven} disabled={mavenLoading}>
              <RefreshCw className={`h-4 w-4 ${mavenLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artifact</TableHead>
                  <TableHead>Latest Version</TableHead>
                  <TableHead className="hidden sm:table-cell">Published</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mavenLoading || mavenArtifacts === null ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder rows have no stable identity
                    <TableRow key={i}>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : mavenError ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-destructive text-sm py-4">
                      {mavenError}
                    </TableCell>
                  </TableRow>
                ) : mavenArtifacts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-muted-foreground text-sm py-4 text-center"
                    >
                      No artifacts found.
                    </TableCell>
                  </TableRow>
                ) : (
                  mavenArtifacts.map((a) => (
                    <TableRow key={`${a.group}:${a.artifact}`}>
                      <TableCell>
                        <a
                          href={`https://search.maven.org/artifact/${a.group}/${a.artifact}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-sm text-primary hover:underline"
                        >
                          {a.artifact}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {a.latestVersion}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(a.timestamp).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
