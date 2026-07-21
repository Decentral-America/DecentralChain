import { CheckCircle, ExternalLink, Loader2, Play, Square, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ALL_SPECS, SMOKE_SPECS } from '@/routes/api.e2e.stream';

// ── Types ─────────────────────────────────────────────────────────────────────
// E2E execution happens in an isolated GitHub Actions run, not in this
// browser tab's server — see api.e2e.stream.ts for why. That means results
// arrive as one structured report once the run completes, not as a scrolling
// live log; while it's running, "View live log on GitHub" links out to
// GitHub's own UI, which DOES stream logs live for a human looking at it
// (the REST/GraphQL API just doesn't expose that to us).

interface VitestAssertion {
  title: string;
  fullName: string;
  status: 'passed' | 'failed' | 'skipped' | 'pending';
  duration?: number;
  failureMessages?: string[];
}
interface VitestFileResult {
  name: string;
  status: 'passed' | 'failed';
  assertionResults: VitestAssertion[];
}
interface VitestReport {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  testResults: VitestFileResult[];
}

type RunState =
  | { phase: 'idle' }
  | { phase: 'dispatching'; runId: string }
  | { phase: 'running'; runId: string; ghStatus: string; htmlUrl: string | null }
  | { phase: 'done'; conclusion: string | null; report: VitestReport | null }
  | { phase: 'error'; message: string };

// ── Component ─────────────────────────────────────────────────────────────────

const ALL_SPECS_FLAT = Object.values(ALL_SPECS).flat();

export default function E2ERunner() {
  const [selected, setSelected] = useState<Set<string>>(new Set(SMOKE_SPECS));
  const [run, setRun] = useState<RunState>({ phase: 'idle' });
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  async function handleStart() {
    try {
      const specsToRun = [...selected];
      const res = await fetch('/api/e2e/stream', {
        body: JSON.stringify({ intent: 'start', specs: specsToRun, suite: 'custom' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setRun({ message: body?.error ?? `HTTP ${res.status}`, phase: 'error' });
        return;
      }

      const { runId } = (await res.json()) as { runId: string };
      setRun({ phase: 'dispatching', runId });

      const es = new EventSource(`/api/e2e/stream?runId=${runId}`);
      esRef.current = es;

      es.addEventListener('status', (e: MessageEvent<string>) => {
        const data = JSON.parse(e.data) as {
          status: string;
          conclusion: string | null;
          htmlUrl: string | null;
        };
        setRun({ ghStatus: data.status, htmlUrl: data.htmlUrl, phase: 'running', runId });
      });

      es.addEventListener('result', (e: MessageEvent<string>) => {
        const data = JSON.parse(e.data) as { report: VitestReport | null };
        setRun((prev) =>
          prev.phase === 'running'
            ? { conclusion: null, phase: 'done', report: data.report }
            : prev,
        );
      });

      es.addEventListener('exit', (e: MessageEvent<string>) => {
        const data = JSON.parse(e.data) as { conclusion: string | null; error?: string };
        setRun((prev) => {
          if (data.error && prev.phase !== 'done') {
            return { message: data.error, phase: 'error' };
          }
          return prev.phase === 'done' ? { ...prev, conclusion: data.conclusion } : prev;
        });
        es.close();
      });

      es.onerror = () => {
        setRun((prev) =>
          prev.phase === 'running' || prev.phase === 'dispatching'
            ? { message: 'Connection to the status stream was lost', phase: 'error' }
            : prev,
        );
        es.close();
      };
    } catch (err) {
      setRun({ message: err instanceof Error ? err.message : String(err), phase: 'error' });
    }
  }

  async function handleStop() {
    esRef.current?.close();
    if (run.phase !== 'running' && run.phase !== 'dispatching') return;
    await fetch('/api/e2e/stream', {
      body: JSON.stringify({ intent: 'stop', runId: run.runId }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    setRun({ phase: 'idle' });
  }

  const isBusy = run.phase === 'dispatching' || run.phase === 'running';
  const report = run.phase === 'done' ? run.report : null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">E2E Test Runner</h1>
      <p className="text-sm text-muted-foreground -mt-4">
        Runs in an isolated GitHub Actions job — the funded test seed never touches this dashboard.
        Results appear once the run finishes.
      </p>

      {/* Spec selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              Test Specs — {selected.size} / {ALL_SPECS_FLAT.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(new Set(SMOKE_SPECS))}
                disabled={isBusy}
                className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
              >
                Smoke
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => setSelected(new Set(ALL_SPECS_FLAT))}
                disabled={isBusy}
                className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
              >
                All
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                disabled={isBusy}
                className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
              >
                None
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.entries(ALL_SPECS) as [string, readonly string[]][]).map(([category, specs]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id={`cat-${category}`}
                  className="h-3.5 w-3.5 rounded accent-primary"
                  checked={specs.every((s) => selected.has(s))}
                  ref={(el) => {
                    if (el)
                      el.indeterminate =
                        specs.some((s) => selected.has(s)) && !specs.every((s) => selected.has(s));
                  }}
                  onChange={(e) => {
                    const next = new Set(selected);
                    if (e.target.checked) for (const s of specs) next.add(s);
                    else for (const s of specs) next.delete(s);
                    setSelected(next);
                  }}
                  disabled={isBusy}
                />
                <label
                  htmlFor={`cat-${category}`}
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer"
                >
                  {category} ({specs.length})
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 pl-5">
                {specs.map((spec) => {
                  const name = spec.replace(/^src\/[^/]+\//, '').replace('.spec.ts', '');
                  const isSmoke = SMOKE_SPECS.includes(spec);
                  return (
                    <label
                      key={spec}
                      className="flex items-center gap-2 text-xs cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded accent-primary shrink-0"
                        checked={selected.has(spec)}
                        onChange={(e) => {
                          const next = new Set(selected);
                          if (e.target.checked) next.add(spec);
                          else next.delete(spec);
                          setSelected(next);
                        }}
                        disabled={isBusy}
                      />
                      <span className="text-foreground group-hover:text-primary transition-colors font-mono">
                        {name}
                      </span>
                      {isSmoke && (
                        <span className="text-[10px] text-yellow-500 shrink-0">smoke</span>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-2 border-t border-border">
            {!isBusy ? (
              <Button onClick={handleStart} disabled={selected.size === 0} className="gap-2">
                <Play className="h-4 w-4" />
                Run {selected.size} spec{selected.size !== 1 ? 's' : ''}
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleStop} className="gap-2">
                <Square className="h-4 w-4" />
                Stop
              </Button>
            )}
            {selected.size === 0 && !isBusy && (
              <span className="text-xs text-muted-foreground">Select at least one spec</span>
            )}

            {isBusy && (
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {run.phase === 'dispatching' ? 'Dispatching…' : run.ghStatus}
                {run.phase === 'running' && run.htmlUrl && (
                  <a
                    href={run.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    View live log on GitHub
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </span>
            )}

            {run.phase === 'done' && (
              <Badge variant={run.conclusion === 'success' ? 'default' : 'destructive'}>
                {run.conclusion === 'success'
                  ? 'Passed'
                  : `Failed (${run.conclusion ?? 'unknown'})`}
              </Badge>
            )}

            {run.phase === 'error' && (
              <span className="text-destructive text-sm">{run.message}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              Results
              <span className="text-xs">
                <span className="text-green-500">{report.numPassedTests}✓</span>
                {report.numFailedTests > 0 && (
                  <span className="text-destructive ml-1">{report.numFailedTests}✗</span>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {report.testResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No results were reported — check the GitHub Actions run for details.
              </p>
            ) : (
              report.testResults.map((file) => (
                <Card key={file.name}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      {file.status === 'passed' ? (
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      )}
                      <span className="font-mono text-sm">{file.name}</span>
                      <Badge
                        variant={file.status === 'passed' ? 'default' : 'destructive'}
                        className="ml-auto"
                      >
                        {file.assertionResults.filter((a) => a.status === 'passed').length}/
                        {file.assertionResults.length}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1">
                      {file.assertionResults.map((test) => (
                        <li
                          key={`${file.name}::${test.fullName}`}
                          className="flex items-start gap-2 text-sm"
                        >
                          {test.status === 'passed' ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                          )}
                          <span
                            className={
                              test.status === 'passed' ? 'text-foreground' : 'text-destructive'
                            }
                          >
                            {test.title}
                          </span>
                          {test.duration !== undefined && (
                            <span className="ml-auto text-xs text-muted-foreground shrink-0">
                              {test.duration}ms
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
