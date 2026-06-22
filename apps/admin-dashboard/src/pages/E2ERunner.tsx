import { CheckCircle, Play, Square, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type E2ESuite } from '@/routes/api.e2e.stream';

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

export default function E2ERunner() {
  const [suite, setSuite] = useState<E2ESuite>('smoke');
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
      const res = await fetch('/api/e2e/stream', {
        body: JSON.stringify({ intent: 'start', suite }),
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

      {/* Explainer */}
      <Card>
        <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
          <p>
            The E2E runner executes the blockchain integration test suite against the live testnet
            node. Tests are real transactions broadcast to the network — they verify that the node
            accepts, processes, and confirms each transaction type end-to-end.
          </p>
          <p>
            <strong className="text-foreground">Smoke suite</strong> (~30 s) — 3 spec files covering
            transfers, invoke-script, and node API health. Use this for a quick sanity check after a
            deployment.
          </p>
          <p>
            <strong className="text-foreground">Full suite</strong> (~8 min) — all 162 tests across
            every transaction type. Use this before cutting a release or after infrastructure
            changes.
          </p>
          <p className="text-xs">
            Output streams live. The <span className="font-mono">Results</span> tab shows a
            structured pass/fail tree; <span className="font-mono">Raw Log</span> shows the full
            Vitest output. The run is killed server-side when you click Stop.
          </p>
        </CardContent>
      </Card>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4 flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="e2e-suite" className="text-sm font-medium">
              Suite
            </label>
            <select
              id="e2e-suite"
              value={suite}
              onChange={(e) => setSuite(e.target.value as E2ESuite)}
              disabled={isRunning}
              className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
            >
              <option value="smoke">Smoke (~30s, 3 specs)</option>
              <option value="full">Full suite (~8min, 162 tests)</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            {!isRunning ? (
              <Button onClick={handleStart} className="gap-2">
                <Play className="h-4 w-4" />
                Run {suite === 'smoke' ? 'Smoke' : 'Full'} Suite
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleStop} className="gap-2">
                <Square className="h-4 w-4" />
                Stop
              </Button>
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
