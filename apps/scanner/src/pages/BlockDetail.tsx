import { useQuery } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Box } from 'lucide-react';
import { Link } from 'react-router';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchBlockAt, fetchBlockById } from '@/lib/api';
import { createPageUrl } from '@/utils';
import CopyButton from '../components/shared/CopyButton';
import { fromUnix, truncate } from '../components/utils/formatters';

export default function BlockDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const height = urlParams.get('height');
  const id = urlParams.get('id');

  const {
    data: block,
    isLoading,
    error,
  } = useQuery({
    enabled: !!(height || id),
    queryFn: async () => {
      if (height) {
        return fetchBlockAt(parseInt(height, 10));
      } else if (id) {
        return fetchBlockById(id);
      }
      throw new Error('No block identifier provided');
    },
    queryKey: ['block', height, id],
  });

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message || 'Failed to load block'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Block Details</h1>
          {block && (
            <p className="text-gray-600 mt-1">Height: {block.height?.toLocaleString() || 'N/A'}</p>
          )}
        </div>
      </div>

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
      ) : block ? (
        <>
          {/* Block Summary */}
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <CardTitle className="flex items-center gap-2">
                <Box className="w-5 h-5" />
                Block Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-2">Block Height</p>
                  <p className="text-2xl font-bold">{block.height?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Timestamp</p>
                  <p className="font-semibold">{fromUnix(block.timestamp)}</p>
                  <p className="text-sm text-gray-500">
                    {block.timestamp ? new Date(block.timestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-2">Block Signature</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-gray-50 p-2 rounded flex-1 overflow-x-auto">
                      {block.signature || 'N/A'}
                    </code>
                    {block.signature && (
                      <CopyButton text={block.signature} label="Copy signature" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Version</p>
                  <Badge>{block.version || 'N/A'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Transactions</p>
                  <p className="font-semibold">{block.transactionCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Block Size</p>
                  <p className="font-semibold">{(block.blocksize || 0).toLocaleString()} bytes</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-2">Reward</p>
                  <p className="font-semibold">{block.reward || 0} DC</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-2">Generator</p>
                  {block.generator ? (
                    <Link
                      to={createPageUrl('Address', `?addr=${block.generator}`)}
                      className="text-blue-600 hover:text-blue-700 font-mono text-sm"
                    >
                      {block.generator}
                    </Link>
                  ) : (
                    <p className="text-gray-500">N/A</p>
                  )}
                </div>
                {block.reference && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 mb-2">Parent Block</p>
                    <Link
                      to={createPageUrl('BlockDetail', `?id=${block.reference}`)}
                      className="text-blue-600 hover:text-blue-700 font-mono text-sm"
                    >
                      {truncate(block.reference, 20)}
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          {block.transactions && block.transactions.length > 0 && (
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle>Transactions ({block.transactions.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {block.transactions.map((tx, index) => (
                    <div
                      key={tx.id || index}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <Link
                          to={createPageUrl('Transaction', `?id=${tx.id}`)}
                          className="text-blue-600 hover:text-blue-700 font-mono text-sm"
                        >
                          {truncate(tx.id, 16)}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">Type: {tx.type}</p>
                      </div>
                      <Badge variant="secondary">Fee: {tx.fee || 0}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw JSON */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle>Raw Block Data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
                {JSON.stringify(block, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Block not found or invalid block identifier provided.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
