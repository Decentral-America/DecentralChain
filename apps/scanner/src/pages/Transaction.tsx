import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, CheckCircle, Clock, Receipt, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchTransactionInfo, fetchUnconfirmedTransactionInfo } from '@/lib/api';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../components/contexts/LanguageContext';
import CopyButton from '../components/shared/CopyButton';
import { formatAmount, fromUnix, truncate } from '../components/utils/formatters';

export default function Transaction() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const initialTxId = urlParams.get('id') || '';

  const [searchTxId, setSearchTxId] = useState(initialTxId);
  const [txId, setTxId] = useState(initialTxId);

  const {
    data: tx,
    isLoading,
    error,
  } = useQuery({
    enabled: !!txId,
    queryFn: async () => {
      if (!txId) return null;
      try {
        const confirmedTx = await fetchTransactionInfo(txId);
        if (confirmedTx) return confirmedTx;
      } catch (err) {
        console.warn('Failed to fetch confirmed transaction:', err);
      }
      try {
        const unconfirmedTx = await fetchUnconfirmedTransactionInfo(txId);
        if (unconfirmedTx) return unconfirmedTx;
      } catch (err) {
        console.warn('Failed to fetch unconfirmed transaction:', err);
      }
      return null;
    },
    queryKey: ['transaction', txId],
  });

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTxId.trim()) {
      setTxId(searchTxId.trim());
      navigate(createPageUrl('Transaction', `?id=${searchTxId.trim()}`));
    }
  };

  const isConfirmed = tx?.height && tx.height > 0;

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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
            <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">{t('transactionDetails')}</h1>
              {tx && (
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

          {isLoading ? (
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
          ) : tx ? (
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
                      <p className="text-sm text-gray-500 mb-2">{t('transactionId')}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-50 p-2 rounded flex-1 overflow-x-auto">
                          {tx.id}
                        </code>
                        <CopyButton text={tx.id} label={t('copyTransactionId')} />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">{t('type')}</p>
                      <Badge variant="secondary" className="text-base">
                        {tx.type}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">{t('version')}</p>
                      <p className="font-semibold">{tx.version}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">{t('timestamp')}</p>
                      <p className="font-semibold">{fromUnix(tx.timestamp)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-2">{t('fee')}</p>
                      <p className="font-semibold">{formatAmount(Number(tx.fee))} DC</p>
                    </div>
                    {tx.height && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">{t('blockHeight')}</p>
                        <Link
                          to={createPageUrl('BlockDetail', `?height=${tx.height}`)}
                          className="text-blue-600 hover:text-blue-700 font-semibold"
                        >
                          {tx.height.toLocaleString()}
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
                    {tx.sender && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">{t('sender')}</p>
                        <Link
                          to={createPageUrl('Address', `?addr=${tx.sender}`)}
                          className="text-blue-600 hover:text-blue-700 font-mono text-sm"
                        >
                          {tx.sender}
                        </Link>
                      </div>
                    )}
                    {tx.recipient && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">{t('recipient')}</p>
                        <Link
                          to={createPageUrl('Address', `?addr=${tx.recipient}`)}
                          className="text-blue-600 hover:text-blue-700 font-mono text-sm"
                        >
                          {tx.recipient}
                        </Link>
                      </div>
                    )}
                    {tx.amount !== undefined && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">{t('amount')}</p>
                        <p className="text-2xl font-bold">{formatAmount(tx.amount)} DC</p>
                      </div>
                    )}
                    {tx.assetId && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">{t('asset')}</p>
                        <Link
                          to={createPageUrl('Asset', `?id=${tx.assetId}`)}
                          className="text-blue-600 hover:text-blue-700 font-mono text-sm"
                        >
                          {truncate(tx.assetId, 16)}
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
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                    {JSON.stringify(tx, null, 2)}
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
