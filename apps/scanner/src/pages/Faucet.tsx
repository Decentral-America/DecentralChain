import { Droplets, ExternalLink, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import CopyButton from '@/components/shared/CopyButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { truncate } from '@/components/utils/formatters';
import { useFaucetHistory } from '@/hooks/useFaucetHistory';

const CONTACT_EMAIL = 'info@decentralchain.io';

export default function Faucet() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [txId, setTxId] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { history, addEntry, isLoading: historyLoading } = useFaucetHistory();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setStatus('loading');
    setMessage('');
    setTxId('');

    try {
      const res = await fetch('/api/faucet', {
        body: JSON.stringify({ address: address.trim() }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      });

      const data = (await res.json()) as {
        success?: boolean;
        txId?: string;
        amount?: number;
        error?: string;
      };

      if (!res.ok || !data.success) {
        setStatus('error');
        setMessage(data.error ?? 'Request failed. Please try again.');
        return;
      }

      setStatus('success');
      setTxId(data.txId ?? '');
      setMessage(`Successfully sent ${data.amount} DCC to your address.`);
      addEntry({ address: address.trim(), amount: data.amount ?? 0, txId: data.txId ?? '' });
      setAddress('');
    } catch {
      setStatus('error');
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-yellow-500/20">
          <Droplets className="w-6 h-6 text-yellow-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">DCC Testnet Faucet</h1>
          <p className="text-sm text-muted-foreground">
            Request free DCC to test on the DecentralChain testnet
          </p>
        </div>
      </div>

      {/* Request Card */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-medium">Testnet Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex gap-3" onSubmit={handleSubmit}>
            <Input
              ref={inputRef}
              className="font-mono text-sm flex-1"
              disabled={status === 'loading'}
              placeholder="Enter your DCC testnet address (starts with 3)"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (status !== 'idle') {
                  setStatus('idle');
                  setMessage('');
                }
              }}
            />
            <Button
              className="min-w-[160px] gap-2"
              disabled={status === 'loading' || !address.trim()}
              type="submit"
            >
              {status === 'loading' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Request DCC
                </>
              )}
            </Button>
          </form>

          {/* Status feedback */}
          {status === 'success' && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 space-y-2">
              <p className="text-sm font-medium text-green-600 dark:text-green-400">{message}</p>
              {txId && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>TX:</span>
                  <Link
                    className="font-mono hover:underline text-primary flex items-center gap-1"
                    to={`/transaction?id=${txId}`}
                  >
                    {truncate(txId, 8)}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <CopyButton text={txId} />
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">{message}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            If you experience any problems with the faucet, please contact us at{' '}
            <a className="underline hover:text-foreground" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          </p>
        </CardContent>
      </Card>

      {/* Recent transactions */}
      <Card className="border-none shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Recent Faucet Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-sm text-muted-foreground py-4 text-center">Loading…</div>
          ) : history.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No transactions yet. Be the first to request testnet DCC!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TX ID</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.txId}>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        <Link
                          className="hover:underline text-primary"
                          to={`/transaction?id=${entry.txId}`}
                        >
                          {truncate(entry.txId, 8)}
                        </Link>
                        <CopyButton text={entry.txId} />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      <div className="flex items-center gap-1">
                        <Link
                          className="hover:underline text-primary"
                          to={`/address?id=${entry.address}`}
                        >
                          {truncate(entry.address, 8)}
                        </Link>
                        <CopyButton text={entry.address} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="font-mono" variant="secondary">
                        +{entry.amount} DCC
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
