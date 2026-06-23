import { CheckCircle, Play, Square, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ALL_SPECS, SMOKE_SPECS } from '@/routes/api.e2e.stream';

// ── Types ─────────────────────────────────────────────────────────────────────

interface LogLine {
  line: string;
  stderr?: boolean;
  event?: 'exit';
  code?: number;
  error?: string;
}

interface ParsedTest {
  name: string;
  pass: boolean;
  durationMs?: number;
  error?: string;
}

interface ParsedFile {
  path: string;
  tests: ParsedTest[];
  pass: boolean;
}

type RunState =
  | { phase: 'idle' }
  | { phase: 'running'; runId: string }
  | { phase: 'done'; exitCode: number }
  | { phase: 'error'; message: string };

// ── Vitest output parser ──────────────────────────────────────────────────────
// Parses vitest --reporter=verbose output lines into a structured tree.

function parseVitestLines(lines: LogLine[]): ParsedFile[] {
  const files: ParsedFile[] = [];
  let current: ParsedFile | null = null;

  for (const { line } of lines) {
    // New spec file: "✓ src/transactions/transfer.spec.ts (11 tests) 28050ms"
    const fileMatch = line.match(/^[\s✓✗×]\s+(src\/.+\.spec\.ts)\s+\((\d+)\s+tests?\)/);
    if (fileMatch) {
      const path = fileMatch[1] ?? '';
      const pass = line.trimStart().startsWith('✓');
      current = { pass, path, tests: [] };
      files.push(current);
      continue;
    }

    if (!current) continue;

    // Individual test: "    ✓ broadcasts and confirms 1741ms"
    const passMatch = line.match(/^\s+✓\s+(.+?)(?:\s+(\d+)ms)?$/);
    if (passMatch) {
      current.tests.push({
        durationMs: passMatch[2] ? Number(passMatch[2]) : undefined,
        name: (passMatch[1] ?? '').trim(),
        pass: true,
      });
      continue;
    }

    // Failing test: "    ✗ transfers fail with wrong chain ID 302ms"
    const failMatch = line.match(/^\s+[✗×]\s+(.+?)(?:\s+(\d+)ms)?$/);
    if (failMatch) {
      current.tests.push({
        durationMs: failMatch[2] ? Number(failMatch[2]) : undefined,
        name: (failMatch[1] ?? '').trim(),
        pass: false,
      });
    }
  }

  return files;
}

// ── Component ─────────────────────────────────────────────────────────────────

const ALL_SPECS_FLAT = Object.values(ALL_SPECS).flat();

export default function E2ERunner() {
  const [selected, setSelected] = useState<Set<string>>(new Set(SMOKE_SPECS));
  const [run, setRun] = useState<RunState>({ phase: 'idle' });
  const [logs, setLogs] = useState<LogLine[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: logs is used as a trigger to scroll when new lines arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  async function handleStart() {
    setLogs([]);
    setRun({ phase: 'running', runId: '' });

    try {
      const specsToRun = [...selected];
      const res = await fetch('/api/e2e/stream', {
        body: JSON.stringify({ intent: 'start', specs: specsToRun, suite: 'custom' }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) {
        const text = await res.text();
        setRun({ message: text || `HTTP ${res.status}`, phase: 'error' });
        return;
      }

      const { runId } = (await res.json()) as { runId: string };
      setRun({ phase: 'running', runId });

      const es = new EventSource(`/api/e2e/stream?runId=${runId}`);
      esRef.current = es;

      es.onmessage = (e: MessageEvent<string>) => {
        try {
          const data = JSON.parse(e.data) as LogLine;
          if (data.event === 'exit') {
            setRun({ exitCode: data.code ?? -1, phase: 'done' });
            es.close();
          } else {
            setLogs((prev) => [...prev, data]);
          }
        } catch {
          /* malformed — ignore */
        }
      };

      es.onerror = () => {
        setRun((prev) =>
          prev.phase === 'running' ? { message: 'Connection lost', phase: 'error' } : prev,
        );
        es.close();
      };
    } catch (err) {
      setRun({ message: err instanceof Error ? err.message : String(err), phase: 'error' });
    }
  }

  async function handleStop() {
    esRef.current?.close();
    if (run.phase !== 'running' || !run.runId) return;
    await fetch('/api/e2e/stream', {
      body: JSON.stringify({ intent: 'stop', runId: run.runId }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    setRun({ exitCode: -1, phase: 'done' });
  }

  const parsedFiles = parseVitestLines(logs);
  const passCount = parsedFiles.flatMap((f) => f.tests).filter((t) => t.pass).length;
  const failCount = parsedFiles.flatMap((f) => f.tests).filter((t) => !t.pass).length;
  const isRunning = run.phase === 'running';
  const isDone = run.phase === 'done';

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">E2E Test Runner</h1>

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
                disabled={isRunning}
                className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
              >
                Smoke
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => setSelected(new Set(ALL_SPECS_FLAT))}
                disabled={isRunning}
                className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
              >
                All
              </button>
              <span className="text-muted-foreground">·</span>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                disabled={isRunning}
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
                  disabled={isRunning}
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
                        disabled={isRunning}
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
            {!isRunning ? (
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
            {selected.size === 0 && (
              <span className="text-xs text-muted-foreground">Select at least one spec</span>
            )}
          </div>

          {isDone && (
            <Badge variant={run.exitCode === 0 ? 'default' : 'destructive'} className="self-end">
              {run.exitCode === 0 ? 'Passed' : `Failed (exit ${run.exitCode})`}
            </Badge>
          )}

          {run.phase === 'error' && (
            <span className="text-destructive text-sm self-end">{run.message}</span>
          )}
        </CardContent>
      </Card>

      {/* Results + live log */}
      {logs.length > 0 && (
        <Tabs defaultValue="results">
          <TabsList>
            <TabsTrigger value="results">
              Results
              {(passCount > 0 || failCount > 0) && (
                <span className="ml-2 text-xs">
                  <span className="text-green-500">{passCount}✓</span>
                  {failCount > 0 && <span className="text-destructive ml-1">{failCount}✗</span>}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="log">Raw Log ({logs.length} lines)</TabsTrigger>
          </TabsList>

          {/* Parsed pass/fail tree */}
          <TabsContent value="results" className="mt-4">
            {parsedFiles.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground text-sm">
                  {isRunning ? 'Waiting for test output…' : 'No parseable test results yet.'}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {parsedFiles.map((file) => (
                  <Card key={file.path}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        {file.pass ? (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <span className="font-mono text-sm">{file.path}</span>
                        <Badge variant={file.pass ? 'default' : 'destructive'} className="ml-auto">
                          {file.tests.filter((t) => t.pass).length}/{file.tests.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    {file.tests.length > 0 && (
                      <CardContent className="pt-0">
                        <ul className="space-y-1">
                          {file.tests.map((test) => (
                            <li
                              key={`${file.path}::${test.name}`}
                              className="flex items-start gap-2 text-sm"
                            >
                              {test.pass ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                              )}
                              <span className={test.pass ? 'text-foreground' : 'text-destructive'}>
                                {test.name}
                              </span>
                              {test.durationMs !== undefined && (
                                <span className="ml-auto text-xs text-muted-foreground shrink-0">
                                  {test.durationMs}ms
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Raw log */}
          <TabsContent value="log" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <ScrollArea maxHeight="480px" className="font-mono text-xs">
                  <div className="p-4 space-y-px">
                    {logs.map((entry, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: log lines are append-only and have no stable identity
                        key={i}
                        className={
                          entry.stderr
                            ? 'text-yellow-500'
                            : entry.line.includes('✗') || entry.line.includes('×')
                              ? 'text-destructive'
                              : entry.line.includes('✓')
                                ? 'text-green-500'
                                : 'text-muted-foreground'
                        }
                      >
                        {entry.line}
                      </div>
                    ))}
                    <div ref={logEndRef} />
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
