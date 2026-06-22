import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouteLoaderData } from 'react-router';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type SweepDoneEvent,
  type SweepErrorEvent,
  type SweepProgressEvent,
} from '@/routes/api.treasury.stream';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ScannedWallet {
  address: string;
  available: number;
  generating: number;
  scanError?: string;
}

type SweepState =
  | { phase: 'idle' }
  | {
      phase: 'running';
      sweepId: string;
      processed: number;
      total: number;
      recovered: number;
      errors: number;
    }
  | { phase: 'done'; processed: number; total: number; recovered: number; errors: number }
  | { phase: 'error'; message: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(wavelets: number): string {
  return (wavelets / 1e8).toLocaleString('en-US', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 4,
  });
}

function truncate(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 8)}…${addr.slice(-6)}`;
}

const DUST_THRESHOLD = 1_000;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Treasury() {
  const root = useRouteLoaderData('root') as { nodeUrl?: string } | undefined;
  const nodeUrl = root?.nodeUrl ?? 'https://testnet-node.decentralchain.io';

  // ── Wallets tab state ──────────────────────────────────────────────────────
  const [wallets, setWallets] = useState<ScannedWallet[]>([]);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanProgress, setScanProgress] = useState<{ processed: number; total: number } | null>(
    null,
  );
  const [scanError, setScanError] = useState<string | null>(null);
  const [showFundedOnly, setShowFundedOnly] = useState(false);

  // ── Sweep tab state ────────────────────────────────────────────────────────
  const [senderAddress, setSenderAddress] = useState('');
  const [sweep, setSweep] = useState<SweepState>({ phase: 'idle' });
  const esRef = useRef<EventSource | null>(null);
  const scanEsRef = useRef<EventSource | null>(null);

  useEffect(() => {
    return () => {
      esRef.current?.close();
      scanEsRef.current?.close();
    };
  }, []);

  // ── Wallet scan (SSE — streams results incrementally) ──────────────────────

  function handleScan() {
    scanEsRef.current?.close();
    setWallets([]);
    setScanLoading(true);
    setScanProgress(null);
    setScanError(null);

    const es = new EventSource(`/api/treasury/scan?nodeUrl=${encodeURIComponent(nodeUrl)}`);
    scanEsRef.current = es;

    es.onmessage = (e: MessageEvent<string>) => {
      try {
        const data = JSON.parse(e.data) as
          | {
              type: 'batch';
              wallets: Array<{
                address: string;
                available: number;
                generating: number;
                funded: boolean;
                scanError?: string;
              }>;
            }
          | { type: 'progress'; processed: number; total: number }
          | { type: 'done'; processed: number; funded: number; totalAvailable: number }
          | { type: 'error'; message: string };

        if (data.type === 'batch') {
          // Single setState per batch of 50 — O(n) total array work across the full scan.
          setWallets((prev) => [
            ...prev,
            ...data.wallets.map((w) => ({
              address: w.address,
              available: w.available,
              generating: w.generating,
              ...(w.scanError ? { scanError: w.scanError } : {}),
            })),
          ]);
        } else if (data.type === 'progress') {
          setScanProgress({ processed: data.processed, total: data.total });
        } else if (data.type === 'done') {
          setScanLoading(false);
          setScanProgress(null);
          es.close();
        } else if (data.type === 'error') {
          setScanError(data.message);
          setScanLoading(false);
          es.close();
        }
      } catch {
        /* malformed event */
      }
    };

    es.onerror = () => {
      setScanError('Scan connection lost — check server logs');
      setScanLoading(false);
      es.close();
    };
  }

  // ── Sweep ──────────────────────────────────────────────────────────────────

  async function handleSweepStart() {
    if (!senderAddress.trim()) return;
    setSweep({ errors: 0, phase: 'running', processed: 0, recovered: 0, sweepId: '', total: 0 });

    try {
      const res = await fetch('/api/treasury/stream', {
        body: JSON.stringify({
          chainId: '!',
          intent: 'start',
          nodeUrl,
          senderAddress: senderAddress.trim(),
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      if (!res.ok) {
        const text = await res.text();
        setSweep({ message: text || `HTTP ${res.status}`, phase: 'error' });
        return;
      }

      const { sweepId } = (await res.json()) as { sweepId: string };
      setSweep((prev) => (prev.phase === 'running' ? { ...prev, sweepId } : prev));

      const es = new EventSource(`/api/treasury/stream?sweepId=${sweepId}`);
      esRef.current = es;

      es.onmessage = (e: MessageEvent<string>) => {
        try {
          const data = JSON.parse(e.data) as SweepProgressEvent | SweepDoneEvent | SweepErrorEvent;

          if (data.event === 'progress') {
            setSweep({
              errors: data.errors,
              phase: 'running',
              processed: data.processed,
              recovered: data.recovered_wavelets,
              sweepId,
              total: data.total,
            });
          } else if (data.event === 'done') {
            setSweep({
              errors: data.errors,
              phase: 'done',
              processed: data.processed,
              recovered: data.recovered_wavelets,
              total: data.total,
            });
            es.close();
          } else if (data.event === 'error') {
            setSweep({ message: data.message, phase: 'error' });
            es.close();
          }
        } catch {
          /* malformed event — ignore */
        }
      };

      es.onerror = () => {
        setSweep((prev) =>
          prev.phase === 'running'
            ? { message: 'Connection lost — check server logs', phase: 'error' }
            : prev,
        );
        es.close();
      };
    } catch (err) {
      setSweep({ message: err instanceof Error ? err.message : String(err), phase: 'error' });
    }
  }

  // ── Derived values ─────────────────────────────────────────────────────────

  const displayWallets = showFundedOnly
    ? wallets.filter((w) => w.available > DUST_THRESHOLD)
    : wallets;

  const fundedCount = wallets.filter((w) => w.available > DUST_THRESHOLD).length;
  const totalAvailable = wallets.reduce((s, w) => s + w.available, 0);

  const sweepProgress =
    sweep.phase === 'running' || sweep.phase === 'done'
      ? sweep.total > 0
        ? Math.round((sweep.processed / sweep.total) * 100)
        : 0
      : 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Treasury</h1>

      <Tabs defaultValue="wallets">
        <TabsList className="grid w-full max-w-sm grid-cols-2">
          <TabsTrigger value="wallets">Wallets</TabsTrigger>
          <TabsTrigger value="sweep">Sweep</TabsTrigger>
        </TabsList>

        {/* ── Wallets Tab ──────────────────────────────────────────────── */}
        <TabsContent value="wallets" className="space-y-4 mt-4">
          {/* Summary cards */}
          {wallets.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Wallets</p>
                  <p className="text-xl font-bold font-mono">{wallets.length.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Funded</p>
                  <p className="text-xl font-bold font-mono text-primary">
                    {fundedCount.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">Total Available</p>
                  <p className="text-xl font-bold font-mono">{fmt(totalAvailable)} DCC</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={handleScan} disabled={scanLoading} size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${scanLoading ? 'animate-spin' : ''}`} />
              {wallets.length === 0 ? 'Scan Wallets' : 'Re-scan'}
            </Button>
            {wallets.length > 0 && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded accent-primary"
                  checked={showFundedOnly}
                  onChange={(e) => setShowFundedOnly(e.target.checked)}
                />
                Show funded only
              </label>
            )}
            {scanProgress && (
              <span className="text-xs text-muted-foreground">
                {scanProgress.processed} / {scanProgress.total} scanned…
              </span>
            )}
          </div>

          {scanError && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              {scanError}
            </div>
          )}

          {/* Wallet table */}
          <Card>
            <CardContent className="p-0">
              {scanLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholder rows have no stable identity
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Address</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                        <TableHead className="text-right">Generating</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayWallets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            {wallets.length === 0
                              ? 'Click "Scan Wallets" to load balances'
                              : 'No funded wallets'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayWallets.map((w, i) => (
                          <TableRow key={w.address}>
                            <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
                            <TableCell className="font-mono text-sm" title={w.address}>
                              {truncate(w.address)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {fmt(w.available)} DCC
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm text-muted-foreground">
                              {fmt(w.generating)} DCC
                            </TableCell>
                            <TableCell className="text-right">
                              {w.scanError ? (
                                <Badge variant="destructive">Error</Badge>
                              ) : w.available > DUST_THRESHOLD ? (
                                <Badge>Funded</Badge>
                              ) : (
                                <Badge variant="secondary">Dust</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Sweep Tab ────────────────────────────────────────────────── */}
        <TabsContent value="sweep" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sweep — Recover DCC from Test Wallets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scans all 2,000 test wallets and transfers every funded wallet's spendable balance
                back to the sender address. A 0.001 DCC fee is deducted per transfer.
              </p>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="sweep-sender" className="text-sm font-medium">
                  Destination Address
                </label>
                <input
                  id="sweep-sender"
                  className="flex h-9 w-full max-w-sm rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  placeholder="3RPEK..."
                  disabled={sweep.phase === 'running'}
                />
              </div>

              <Button
                onClick={handleSweepStart}
                disabled={sweep.phase === 'running' || !senderAddress.trim()}
                variant={sweep.phase === 'running' ? 'secondary' : 'default'}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {sweep.phase === 'running' ? 'Sweeping…' : 'Start Sweep'}
              </Button>

              {/* Progress */}
              {(sweep.phase === 'running' || sweep.phase === 'done') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>
                      {sweep.processed} / {sweep.total} wallets
                      {sweep.phase === 'done' && ' — complete'}
                    </span>
                    <span className="font-mono">{sweepProgress}%</span>
                  </div>
                  <Progress value={sweepProgress} />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm pt-2">
                    <div>
                      <p className="text-muted-foreground text-xs">Recovered</p>
                      <p className="font-mono font-bold">{fmt(sweep.recovered)} DCC</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Errors</p>
                      <p
                        className={`font-mono font-bold ${sweep.errors > 0 ? 'text-destructive' : ''}`}
                      >
                        {sweep.errors}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Status</p>
                      <p className="font-mono font-bold capitalize">{sweep.phase}</p>
                    </div>
                  </div>
                </div>
              )}

              {sweep.phase === 'error' && (
                <div className="flex items-start gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{sweep.message}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
