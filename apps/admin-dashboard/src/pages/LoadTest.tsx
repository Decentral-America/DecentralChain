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

// ── Types ─────────────────────────────────────────────────────────────────────

interface MetricPoint {
  t: number;
  tps: number;
  sent: number;
  confirmed: number;
  errors: number;
}

interface FinalSummary {
  totalSent: number;
  totalConfirmed: number;
  totalErrors: number;
  avgTps: number;
  duration: number;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LoadTest() {
  const [targetNode, setTargetNode] = useState('');
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
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [finalSummary, setFinalSummary] = useState<FinalSummary | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  // Passes senderSeed to the server so it can derive the address securely server-side.
  // The seed never appears in a URL query param or response body.
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
    setError(null);
    setMetrics([]);
    setFinalSummary(null);

    try {
      // Auto-fund: distribute DCC to N test wallets before the run
      if (autoFund) {
        await fundWallets();
      }

      const res = await fetch('/api/load-test/stream', {
        body: JSON.stringify({
          chainId,
          duration: Number(duration),
          intent: 'start',
          seedPhrase,
          senderCount: Number(senderCount),
          targetNode,
          targetTps: Number(targetTps),
          workers: Number(workers),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) {
        setError(`Failed to start: HTTP ${res.status}`);
        return;
      }

      const data = (await res.json()) as { runId: string };
      setRunId(data.runId);
      setRunning(true);

      const es = new EventSource(`/api/load-test/stream?runId=${data.runId}`);
      esRef.current = es;

      es.onmessage = (e: MessageEvent<string>) => {
        try {
          const parsed = JSON.parse(e.data) as MetricPoint;
          setMetrics((prev) => [...prev, parsed]);
        } catch (err) {
          console.error('[load-test] Malformed metric line:', e.data, err);
        }
      };

      es.addEventListener('final', (e: MessageEvent<string>) => {
        try {
          const summary = JSON.parse(e.data) as FinalSummary;
          setFinalSummary(summary);
        } catch (err) {
          console.error('[load-test] Malformed final event:', e.data, err);
        }
        setRunning(false);
        es.close();

        // Auto-sweep: kick off wallet recovery when run finishes.
        // Server derives the sender address from senderSeed — seed never leaves over the wire in a GET/URL.
        if (autoSweep && seedPhrase && targetNode) {
          triggerAutoSweep().catch((sweepErr) => {
            console.error('[load-test] Auto-sweep failed:', sweepErr);
          });
        }
      });

      es.onerror = () => {
        setRunning(false);
        es.close();
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleStop() {
    if (!runId) return;
    esRef.current?.close();
    await fetch('/api/load-test/stream', {
      body: JSON.stringify({ intent: 'stop', runId }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
    setRunning(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Load Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="lt-node" className="text-sm font-medium">
              Target Node URL
            </label>
            <Input
              id="lt-node"
              value={targetNode}
              onChange={(e) => setTargetNode(e.target.value)}
              placeholder="https://testnet-node.decentralchain.io"
              disabled={running}
            />
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
              disabled={running}
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
              disabled={running}
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
              disabled={running}
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
              disabled={running}
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
              disabled={running}
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-2">
            <label htmlFor="lt-seed" className="text-sm font-medium">
              Seed Phrase
            </label>
            <Input
              id="lt-seed"
              type="password"
              value={seedPhrase}
              onChange={(e) => setSeedPhrase(e.target.value)}
              placeholder="wallet seed phrase"
              disabled={running}
            />
          </div>

          {/* Treasury integration */}
          <div className="sm:col-span-2 lg:col-span-3 border-t border-border pt-4 mt-2 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Treasury
            </p>
            <div className="flex flex-wrap gap-4">
              <Checkbox
                label="Auto-fund wallets before test"
                checked={autoFund}
                onChange={(e) => setAutoFund(e.target.checked)}
                disabled={running}
              />
              <Checkbox
                label="Auto-sweep wallets after test"
                checked={autoSweep}
                onChange={(e) => setAutoSweep(e.target.checked)}
                disabled={running}
              />
            </div>

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
                    disabled={running}
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
                    disabled={running}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            {!running ? (
              <Button onClick={handleStart} disabled={!targetNode || !seedPhrase}>
                Start
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleStop}>
                Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-destructive text-sm">{error}</p>}

      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Live TPS</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={metrics}>
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

      {finalSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Final Summary</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Avg TPS</p>
              <p className="font-mono font-bold text-lg">{finalSummary.avgTps.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Sent</p>
              <p className="font-mono font-bold text-lg">
                {finalSummary.totalSent.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Confirmed</p>
              <p className="font-mono font-bold text-lg">
                {finalSummary.totalConfirmed.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Errors</p>
              <p className="font-mono font-bold text-lg text-destructive">
                {finalSummary.totalErrors.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
