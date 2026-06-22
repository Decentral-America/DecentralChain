import { Activity, AlertCircle, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { type ServiceStatus } from '@/routes/api.services.health';

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusIcon(status: ServiceStatus['status']): React.ReactNode {
  switch (status) {
    case 'up':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'down':
      return <XCircle className="h-5 w-5 text-destructive" />;
    case 'degraded':
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  }
}

function latencyColor(ms: number): string {
  if (ms < 500) return 'text-green-500';
  if (ms < 1500) return 'text-yellow-500';
  return 'text-destructive';
}

function latencyBar(ms: number): string {
  // Visual bar: scale 0–3000ms → 0–100%
  const pct = Math.min(100, (ms / 3000) * 100);
  if (pct < 20) return 'bg-green-500';
  if (pct < 60) return 'bg-yellow-500';
  return 'bg-destructive';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ServiceHealth() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [summary, setSummary] = useState<{
    up: number;
    down: number;
    degraded: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as {
        services: ServiceStatus[];
        summary: { up: number; down: number; degraded: number; total: number };
      };
      setServices(data.services);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 15_000);
    return () => clearInterval(interval);
  }, [load]);

  const newarkServices = services.filter((s) => s.category === 'newark');

  const overallStatus =
    summary === null
      ? 'unknown'
      : summary.down > 0
        ? 'incident'
        : summary.degraded > 0
          ? 'degraded'
          : 'operational';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Service Health</h1>
          {summary && (
            <Badge
              variant={
                overallStatus === 'operational'
                  ? 'default'
                  : overallStatus === 'degraded'
                    ? 'secondary'
                    : 'destructive'
              }
              className="text-xs"
            >
              {overallStatus === 'operational'
                ? 'All systems operational'
                : overallStatus === 'degraded'
                  ? 'Degraded performance'
                  : 'Incident in progress'}
            </Badge>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Summary stat row */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Operational</p>
              <p className="text-2xl font-bold font-mono text-green-500">{summary.up}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Degraded</p>
              <p className="text-2xl font-bold font-mono text-yellow-500">{summary.degraded}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Down</p>
              <p
                className={`text-2xl font-bold font-mono ${summary.down > 0 ? 'text-destructive' : 'text-muted-foreground'}`}
              >
                {summary.down}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Newark services */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Newark Services (66.228.55.154)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading && services.length === 0 ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {newarkServices.map((svc) => (
                <div key={svc.name} className="flex items-center gap-4 px-4 py-3">
                  <span className="shrink-0">{statusIcon(svc.status)}</span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{svc.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{svc.url}</p>
                  </div>

                  {svc.latencyMs !== undefined && svc.status !== 'down' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full ${latencyBar(svc.latencyMs)}`}
                          style={{ width: `${Math.min(100, (svc.latencyMs / 3000) * 100)}%` }}
                        />
                      </div>
                      <span
                        className={`font-mono text-xs w-12 text-right ${latencyColor(svc.latencyMs)}`}
                      >
                        {svc.latencyMs}ms
                      </span>
                    </div>
                  )}

                  {svc.httpCode !== undefined && (
                    <Badge
                      variant={svc.status === 'up' ? 'secondary' : 'destructive'}
                      className="font-mono text-xs shrink-0"
                    >
                      {svc.httpCode}
                    </Badge>
                  )}

                  {svc.detail && (
                    <span
                      className="text-xs text-destructive shrink-0 max-w-[140px] truncate"
                      title={svc.detail}
                    >
                      {svc.detail}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* LKE nodes note */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Frankfurt LKE — gen-0, gen-1, val-0
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            LKE node REST APIs are not publicly routable. Their connectivity and block production
            health is visible on the{' '}
            <a href="/" className="text-primary hover:underline">
              Nodes page
            </a>{' '}
            — if they appear in Connected Peers and the block leaderboard, they are operating
            correctly.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
