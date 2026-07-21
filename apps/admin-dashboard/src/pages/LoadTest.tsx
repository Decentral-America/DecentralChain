import { ExternalLink, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DEFAULT_TARGET_NODE, TARGET_NODES } from '@/lib/target-nodes';

// ── Types ─────────────────────────────────────────────────────────────────────
// The load tester runs in an isolated GitHub Actions run, not in this
// container — see api.load-test.stream.ts for why. The funded sender seed is
// a GitHub Actions secret and is never sent from this page; the "Seed
// Phrase" field below is ONLY used for the optional Treasury auto-fund/sweep
// convenience, not for the stress test's own signer.
//
// Because GitHub's API doesn't expose live metrics for an in-progress run,
// the TPS chart renders in full — from the load-tester's own per-second tick
// events — once the run completes, rather than growing live during it.

interface TickEvent {
  event: 'tick' | 'phase_end' | 'final';
  t?: number;
  tps?: number;
  sent?: number;
  confirmed?: number;
  errors?: number;
  avg_tps?: number;
  total_sent?: number;
  total_confirmed?: number;
  p50_ms?: number;
  p95_ms?: number;
  p99_ms?: number;
}

type RunState =
  | { phase: 'idle' }
  | { phase: 'dispatching' }
  | { phase: 'running'; ghStatus: string; htmlUrl: string | null }
  | {
      phase: 'done';
      conclusion: string | null;
      ticks: TickEvent[];
      finalEvent: TickEvent | undefined;
    }
  | { phase: 'error'; message: string };

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoadTest() {
  const [targetNode, setTargetNode] = useState(DEFAULT_TARGET_NODE);
  const [workers, setWorkers] = useState('200');
  const [targetTps, setTargetTps] = useState('500');
  const [duration, setDuration] = useState('300');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [chainId, setChainId] = useState('!');
  const [senderCount, setSenderCount] = useState('1');

  // Treasury integration
  const [autoFund, setAutoFund] = useState(false);
  const [autoSweep, setAutoSweep] = useState(false);
  const [fundWalletCount, setFundWalletCount] = useState('100');
  const [fundAmountDcc, setFundAmountDcc] = useState('10');

  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunState>({ phase: 'idle' });

  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  // ── Auto-fund ──────────────────────────────────────────────────────────────

  async function fundWallets(): Promise<boolean> {
    const res = await fetch('/api/treasury/fund', {
      body: JSON.stringify({
        amountDcc: Number(fundAmountDcc),
        chainId,
        count: Number(fundWalletCount),
        intent: 'fund',
        nodeUrl: targetNode,
        senderSeed: seedPhrase,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Auto-fund failed: ${text || `HTTP ${res.status}`}`);
    }
    return true;
  }

  // ── Auto-sweep ─────────────────────────────────────────────────────────────
  async function triggerAutoSweep(): Promise<void> {
    const res = await fetch('/api/treasury/stream', {
      body: JSON.stringify({
        chainId,
        intent: 'start',
        nodeUrl: targetNode,
        senderSeed: seedPhrase,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Auto-sweep failed: ${text || `HTTP ${res.status}`}`);
    }
    // Fire-and-forget — sweep runs server-side; progress visible in Treasury > Sweep tab.
  }

  // ── Start ──────────────────────────────────────────────────────────────────

  async function handleStart() {
    setRun({ phase: 'dispatching' });

    try {
      if (autoFund) {
        await fundWallets();
      }

      const res = await fetch('/api/load-test/stream', {
        body: JSON.stringify({
          chainId,
          duration: Number(duration),
          intent: 'start',
          senderCount: Number(senderCount),
          targetNode,
          targetTps: Number(targetTps),
          workers: Number(workers),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setRun({ message: body?.error ?? `HTTP ${res.status}`, phase: 'error' });
        return;
      }

      const data = (await res.json()) as { runId: string };
      setRunId(data.runId);

      const es = new EventSource(`/api/load-test/stream?runId=${data.runId}`);
      esRef.current = es;

      es.addEventListener('status', (e: MessageEvent<string>) => {
        const parsed = JSON.parse(e.data) as {
          status: string;
          conclusion: string | null;
          htmlUrl: string | null;
        };
        setRun({ ghStatus: parsed.status, htmlUrl: parsed.htmlUrl, phase: 'running' });
      });

      es.addEventListener('result', (e: MessageEvent<string>) => {
        const parsed = JSON.parse(e.data) as {
          ticks: TickEvent[];
          finalEvent: TickEvent | undefined;
        };
        setRun({
          conclusion: null,
          finalEvent: parsed.finalEvent,
          phase: 'done',
          ticks: parsed.ticks,
        });
      });

      es.addEventListener('exit', (e: MessageEvent<string>) => {
        const parsed = JSON.parse(e.data) as { conclusion: string | null; error?: string };
        setRun((prev) => {
          if (parsed.error && prev.phase !== 'done') {
            return { message: parsed.error, phase: 'error' };
          }
          return prev.phase === 'done' ? { ...prev, conclusion: parsed.conclusion } : prev;
        });
        es.close();

        if (autoSweep && seedPhrase && targetNode) {
          triggerAutoSweep().catch((sweepErr) => {
            console.error('[load-test] Auto-sweep failed:', sweepErr);
          });
        }
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
    if (!runId) return;
    await fetch('/api/load-test/stream', {
      body: JSON.stringify({ intent: 'stop', runId }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    setRun({ phase: 'idle' });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const isBusy = run.phase === 'dispatching' || run.phase === 'running';
  const ticks = run.phase === 'done' ? run.ticks : [];
  const finalEvent = run.phase === 'done' ? run.finalEvent : undefined;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Load Test</h1>
      <p className="text-sm text-muted-foreground -mt-4">
        Runs in an isolated GitHub Actions job — the funded sender seed never touches this
        dashboard. The TPS chart renders in full once the run finishes.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lt-node" className="text-sm font-medium">
              Target Node URL
            </label>
            <Select
              id="lt-node"
              value={targetNode}
              onChange={(e) => setTargetNode(e.target.value)}
              disabled={isBusy}
            >
              {TARGET_NODES.map((n) => (
                <option key={n.url} value={n.url}>
                  {n.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lt-workers" className="text-sm font-medium">
              Workers
            </label>
            <Input
              id="lt-workers"
              type="number"
              value={workers}
              onChange={(e) => setWorkers(e.target.value)}
              min="1"
              disabled={isBusy}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lt-tps" className="text-sm font-medium">
              Target TPS
            </label>
            <Input
              id="lt-tps"
              type="number"
              value={targetTps}
              onChange={(e) => setTargetTps(e.target.value)}
              min="1"
              disabled={isBusy}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lt-duration" className="text-sm font-medium">
              Duration (seconds)
            </label>
            <Input
              id="lt-duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              min="1"
              disabled={isBusy}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lt-chain-id" className="text-sm font-medium">
              Chain ID
            </label>
            <Input
              id="lt-chain-id"
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              maxLength={1}
              disabled={isBusy}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lt-sender-count" className="text-sm font-medium">
              Sender Count
            </label>
            <Input
              id="lt-sender-count"
              type="number"
              value={senderCount}
              onChange={(e) => setSenderCount(e.target.value)}
              min="1"
              max="100"
              disabled={isBusy}
            />
          </div>

          {/* Treasury integration */}
          <div className="sm:col-span-2 lg:col-span-3 border-t border-border pt-4 mt-2 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Treasury (optional)
            </p>
            <div className="flex flex-wrap gap-4">
              <Checkbox
                label="Auto-fund wallets before test"
                checked={autoFund}
                onChange={(e) => setAutoFund(e.target.checked)}
                disabled={isBusy}
              />
              <Checkbox
                label="Auto-sweep wallets after test"
                checked={autoSweep}
                onChange={(e) => setAutoSweep(e.target.checked)}
                disabled={isBusy}
              />
            </div>

            {(autoFund || autoSweep) && (
              <div className="flex flex-col gap-1.5 max-w-md">
                <label htmlFor="lt-seed" className="text-sm font-medium">
                  Treasury Seed Phrase
                </label>
                <Input
                  id="lt-seed"
                  type="password"
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  placeholder="wallet seed phrase (for auto-fund/sweep only)"
                  disabled={isBusy}
                />
                <p className="text-xs text-muted-foreground">
                  Only used to fund/sweep test wallets — the stress test itself signs with its own
                  GitHub Actions secret, never this field.
                </p>
              </div>
            )}

            {autoFund && (
              <div className="grid grid-cols-2 gap-4 max-w-sm">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lt-fund-count" className="text-sm font-medium">
                    Wallets to fund
                  </label>
                  <Input
                    id="lt-fund-count"
                    type="number"
                    value={fundWalletCount}
                    onChange={(e) => setFundWalletCount(e.target.value)}
                    min="1"
                    max="2000"
                    disabled={isBusy}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="lt-fund-amount" className="text-sm font-medium">
                    DCC per wallet
                  </label>
                  <Input
                    id="lt-fund-amount"
                    type="number"
                    value={fundAmountDcc}
                    onChange={(e) => setFundAmountDcc(e.target.value)}
                    min="1"
                    disabled={isBusy}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
            {!isBusy ? (
              <Button onClick={handleStart} disabled={!targetNode}>
                Start
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleStop}>
                Stop
              </Button>
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
          </div>
        </CardContent>
      </Card>

      {run.phase === 'error' && <p className="text-destructive text-sm">{run.message}</p>}

      {ticks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>TPS over time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={ticks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="t" tickFormatter={(v: number) => `${v}s`} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="tps" stroke="var(--color-chart-1)" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {finalEvent && (
        <Card>
          <CardHeader>
            <CardTitle>Final Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Avg TPS</p>
              <p className="font-mono font-bold text-lg">{(finalEvent.avg_tps ?? 0).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Sent</p>
              <p className="font-mono font-bold text-lg">
                {(finalEvent.total_sent ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Confirmed</p>
              <p className="font-mono font-bold text-lg">
                {(finalEvent.total_confirmed ?? 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Errors</p>
              <p className="font-mono font-bold text-lg text-destructive">
                {(finalEvent.errors ?? 0).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
