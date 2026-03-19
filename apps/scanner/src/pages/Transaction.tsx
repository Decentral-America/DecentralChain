import { AlertCircle, ArrowLeft, CheckCircle, Clock, Receipt, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { data, Link, useLoaderData, useNavigate, useSearchParams } from 'react-router';
import RouteError from '@/components/RouteError';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useTransaction } from '@/hooks/useTransactions';
import { fetchTransactionInfo, fetchUnconfirmedTransactionInfo } from '@/lib/api';
import { type Transaction as TransactionType } from '@/types';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../components/contexts/LanguageContext';
import CopyButton from '../components/shared/CopyButton';
import { formatAmount, fromUnix, truncate } from '../components/utils/formatters';

interface LoaderData {
  tx: TransactionType | null;
}

export async function loader({ request }: { request: Request }): Promise<LoaderData> {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return { tx: null };
  const tx =
    ((await fetchTransactionInfo(id).catch(() => null)) as Transaction | null) ??
    ((await fetchUnconfirmedTransactionInfo(id).catch(() => null)) as Transaction | null);
  if (!tx) {
    throw data('Transaction not found', { status: 404 });
  }
  return { tx };
}

export function ErrorBoundary() {
  return (
    <RouteError
      notFoundTitle="Transaction Not Found"
      notFoundDescription="No transaction with that ID exists on DecentralChain. Please check the ID and try again."
    />
  );
}

export function meta({ data }: { data?: LoaderData }) {
  if (!data?.tx) return [{ title: 'Transaction — DecentralScan' }];
  return [
    { title: `Tx ${data.tx.id.slice(0, 8)}… — DecentralScan` },
    { content: `Transaction ${data.tx.id} on DecentralChain`, name: 'description' },
  ];
}

export default function Transaction() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { tx: serverTx } = useLoaderData() as LoaderData;
  const [searchParams] = useSearchParams();
  const txId = searchParams.get('id') ?? '';

  const [searchTxId, setSearchTxId] = useState(txId);

  const { data: tx, isLoading, error } = useTransaction(txId ?? null);

  // Merge server-fetched data as initial data when query key matches
  const displayTx = tx ?? serverTx ?? null;

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTxId.trim()) {
      navigate(createPageUrl('Transaction', `?id=${searchTxId.trim()}`));
    }
  };

  const isConfirmed = displayTx?.height && displayTx.height > 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            {t('searchTransaction')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('enterTransactionId')}
                value={searchTxId}
                onChange={(e) => setSearchTxId(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={!searchTxId.trim()}>
              {t('search')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {txId && (
        <>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-foreground">{t('transactionDetails')}</h1>
              {displayTx && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={isConfirmed ? 'default' : 'secondary'}>
                    {isConfirmed ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t('confirmed')}
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        {t('unconfirmed')}
                      </>
                    )}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message || t('failedToLoadTransaction')}</AlertDescription>
            </Alert>
          )}

          {isLoading && !displayTx ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {Array.from({ length: 8 }, (_, skeletonIndex) => `skeleton-${skeletonIndex}`).map(
                    (skeletonKey) => (
                      <div key={skeletonKey}>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-6 w-full" />
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          ) : displayTx ? (
            <>
              {/* Transaction Summary */}
              <Card className="border-none shadow-lg">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    {t('transactionInformation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <p className="text-sm text-muted-foreground mb-2">{t('transactionId')}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted p-2 rounded flex-1 overflow-x-auto">
                          {displayTx.id}
                        </code>
                        <CopyButton text={displayTx.id} label={t('copyTransactionId')} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t('type')}</p>
                      <Badge variant="secondary" className="text-base">
                        {displayTx.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t('version')}</p>
                      <p className="font-semibold">{displayTx.version}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t('timestamp')}</p>
                      <p className="font-semibold">{fromUnix(displayTx.timestamp)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(displayTx.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">{t('fee')}</p>
                      <p className="font-semibold">{formatAmount(Number(displayTx.fee))} DC</p>
                    </div>
                    {displayTx.height && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{t('blockHeight')}</p>
                        <Link
                          to={createPageUrl('BlockDetail', `?height=${displayTx.height}`)}
                          className="text-link hover:text-link-hover font-semibold"
                        >
                          {displayTx.height.toLocaleString()}
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Parties */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>{t('transactionParties')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {displayTx.sender && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{t('sender')}</p>
                        <Link
                          to={createPageUrl('Address', `?addr=${displayTx.sender}`)}
                          className="text-link hover:text-link-hover font-mono text-sm"
                        >
                          {displayTx.sender}
                        </Link>
                      </div>
                    )}
                    {displayTx.recipient && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{t('recipient')}</p>
                        <Link
                          to={createPageUrl('Address', `?addr=${displayTx.recipient}`)}
                          className="text-link hover:text-link-hover font-mono text-sm"
                        >
                          {displayTx.recipient}
                        </Link>
                      </div>
                    )}
                    {displayTx.amount !== undefined && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{t('amount')}</p>
                        <p className="text-2xl font-bold">{formatAmount(displayTx.amount)} DC</p>
                      </div>
                    )}
                    {displayTx.assetId && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">{t('asset')}</p>
                        <Link
                          to={createPageUrl('Asset', `?id=${displayTx.assetId}`)}
                          className="text-link hover:text-link-hover font-mono text-sm"
                        >
                          {truncate(displayTx.assetId, 16)}
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Raw JSON */}
              <Card className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle>{t('rawTransactionData')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(displayTx, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{t('transactionNotFound')}</AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
