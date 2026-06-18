import { CheckCircle, Clock, ExternalLink } from 'lucide-react';
import CopyButton from '@/components/shared/CopyButton';
import { Badge } from '@/components/ui/badge';
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
import { formatAmount, truncate } from '@/components/utils/formatters';
import { useMassTransferFeed } from '../hooks/useMassTransferFeed';

const TESTNET_EXPLORER = 'https://testnet-explorer.decentralchain.io';

function formatTs(ms: number): string {
  if (!ms) return '—';
  const d = new Date(ms);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss} UTC`;
}

export function MassTransferFeed() {
  const { data: txs, isLoading } = useMassTransferFeed();

  return (
    <Card className="border-none shadow-lg h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-blue-500" />
          Mass Transfer Feed
          {txs && (
            <Badge variant="secondary" className="ml-auto">
              {txs.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Tx Hash</TableHead>
              <TableHead className="text-xs">Time</TableHead>
              <TableHead className="text-xs">Sender</TableHead>
              <TableHead className="text-xs text-right">Recipients</TableHead>
              <TableHead className="text-xs text-right">Total</TableHead>
              <TableHead className="text-xs w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 8 }, (_, i) => `sk-mt-${i}`).map((k) => (
                <TableRow key={k}>
                  {Array.from({ length: 6 }, (_, j) => `sk-cell-${j}`).map((ck) => (
                    <TableCell key={ck}>
                      <Skeleton className="h-3 w-16" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !txs || txs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-12 text-sm">
                  No mass transfers found. Polling every 5s…
                </TableCell>
              </TableRow>
            ) : (
              txs.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="hover:bg-muted cursor-pointer"
                  onClick={() => window.open(`${TESTNET_EXPLORER}/transactions/${tx.id}`, '_blank')}
                >
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <code className="text-xs font-mono">{truncate(tx.id, 6)}</code>
                      <CopyButton text={tx.id} label="Copy tx ID" />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTs(tx.timestamp)}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs font-mono">{truncate(tx.sender, 6)}</code>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {tx.transfers.length}
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {formatAmount(tx.totalAmount)} DCC
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {tx.applicationStatus === 'succeeded' ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : null}
                      <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
