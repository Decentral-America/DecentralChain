import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Clock, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { fetchUnconfirmedTransactions } from '@/lib/api';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../components/contexts/LanguageContext';
import CopyButton from '../components/shared/CopyButton';
import { formatAmount, timeAgo, truncate } from '../components/utils/formatters';

export default function UnconfirmedTransactions() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: transactions,
    isLoading,
    error,
  } = useQuery({
    queryFn: () => fetchUnconfirmedTransactions(),
    queryKey: ['unconfirmedTransactions'],
    refetchInterval: autoRefresh ? 5000 : false,
  });

  const filteredTransactions = transactions?.filter((tx) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      tx.id?.toLowerCase().includes(search) ||
      tx.sender?.toLowerCase().includes(search) ||
      tx.recipient?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            {t('unconfirmedTransactions')}
          </h1>
          <p className="text-muted-foreground">{t('transactionsWaitingBlocks')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
            {t('autoRefresh')}
          </Label>
          <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          {autoRefresh && <RefreshCw className="w-4 h-4 text-info animate-spin" />}
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              {t('pendingTransactions')} ({filteredTransactions?.length || 0})
            </CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchByIdOrAddress')}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <Alert variant="destructive" className="m-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('failedToLoadUnconfirmed')}</AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('transactionId')}</TableHead>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('from')}</TableHead>
                  <TableHead>{t('to')}</TableHead>
                  <TableHead className="text-right">{t('amount')}</TableHead>
                  <TableHead className="text-right">{t('fee')}</TableHead>
                  <TableHead>{t('time')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }, (_, rowIndex) => `row-${rowIndex}`).map((rowKey) => (
                    <TableRow key={rowKey}>
                      {Array.from({ length: 7 }, (_, cellIndex) => `cell-${cellIndex}`).map(
                        (cellKey) => (
                          <TableCell key={cellKey}>
                            <Skeleton className="h-4 w-full" />
                          </TableCell>
                        ),
                      )}
                    </TableRow>
                  ))
                ) : filteredTransactions && filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <TableRow
                      key={tx.id}
                      className="hover:bg-muted cursor-pointer"
                      onClick={() => navigate(createPageUrl('Transaction', `?id=${tx.id}`))}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Link
                            to={createPageUrl('Transaction', `?id=${tx.id}`)}
                            className="text-link hover:text-link-hover font-mono text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncate(tx.id, 10)}
                          </Link>
                          <CopyButton text={tx.id} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{tx.type}</Badge>
                      </TableCell>
                      <TableCell>
                        {tx.sender ? (
                          <Link
                            to={createPageUrl('Address', `?addr=${tx.sender}`)}
                            className="text-link hover:text-link-hover font-mono text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncate(tx.sender, 8)}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {tx.recipient ? (
                          <Link
                            to={createPageUrl('Address', `?addr=${tx.recipient}`)}
                            className="text-link hover:text-link-hover font-mono text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncate(tx.recipient, 8)}
                          </Link>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {tx.amount ? `${formatAmount(tx.amount)} DC` : '-'}
                      </TableCell>
                      <TableCell className="text-right">{formatAmount(tx.fee)} DC</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {timeAgo(tx.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      {searchTerm ? t('noTransactionsMatch') : t('noUnconfirmedTransactions')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
