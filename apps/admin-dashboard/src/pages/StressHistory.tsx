import { RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
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
import { type LoadTestRun } from '@/routes/api.load-test.history';

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StressHistory() {
  const [runs, setRuns] = useState<LoadTestRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/load-test/history');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { runs: LoadTestRun[] };
      setRuns(data.runs);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  async function handleDelete(id: string) {
    await fetch('/api/load-test/history', {
      body: JSON.stringify({ id, intent: 'delete' }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    setRuns((prev) => prev.filter((r) => r.id !== id));
  }

  const chartData = runs
    .slice()
    .reverse()
    .map((r, i) => ({
      avgTps: r.result.avgTps,
      i: i + 1,
      label: relativeTime(r.startedAt),
    }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stress Test History</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={loadHistory}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {/* TPS trend chart */}
      {chartData.length >= 2 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Avg TPS — last {chartData.length} runs</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} unit=" TPS" />
                <Tooltip formatter={(value) => [`${Number(value).toFixed(1)} TPS`, 'Avg TPS']} />
                <Line
                  type="monotone"
                  dataKey="avgTps"
                  stroke="var(--color-chart-1)"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* History table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>When</TableHead>
                  <TableHead>Target Node</TableHead>
                  <TableHead className="text-right">Workers</TableHead>
                  <TableHead className="text-right">Target TPS</TableHead>
                  <TableHead className="text-right">Avg TPS</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder
                    <TableRow key={i}>
                      <TableCell colSpan={9}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : runs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No runs saved yet. Load test runs are saved when they complete.
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {relativeTime(run.startedAt)}
                      </TableCell>
                      <TableCell
                        className="font-mono text-xs truncate max-w-[160px]"
                        title={run.config.targetNode}
                      >
                        {run.config.targetNode.replace(/^https?:\/\//, '')}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {run.config.workers}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {run.config.targetTps}
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-sm">
                        {run.result.avgTps.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {run.result.totalSent.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {run.result.totalErrors > 0 ? (
                          <Badge variant="destructive" className="font-mono text-xs">
                            {run.result.totalErrors}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-mono text-xs">
                            0
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{run.user}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(run.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
