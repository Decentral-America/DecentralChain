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
import { Input } from '@/components/ui/input';

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

export default function LoadTest() {
  const [targetNode, setTargetNode] = useState('');
  const [workers, setWorkers] = useState('200');
  const [targetTps, setTargetTps] = useState('500');
  const [duration, setDuration] = useState('300');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [chainId, setChainId] = useState('!');
  const [senderCount, setSenderCount] = useState('1');

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

  async function handleStart() {
    setError(null);
    setMetrics([]);
    setFinalSummary(null);

    try {
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
