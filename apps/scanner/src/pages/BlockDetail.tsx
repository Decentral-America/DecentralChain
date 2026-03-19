import { AlertCircle, ArrowLeft, Box } from 'lucide-react';
import { data, Link, useLoaderData, useNavigate, useSearchParams } from 'react-router';
import RouteError from '@/components/RouteError';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlockAt, useBlockById } from '@/hooks/useBlocks';
import { fetchBlockById, fetchBlockHeadersSeq, type IBlock } from '@/lib/api';
import { createPageUrl } from '@/utils';
import CopyButton from '../components/shared/CopyButton';
import { fromUnix, truncate } from '../components/utils/formatters';

/**
 * DCC-156 — Deferred data streaming.
 *
 * For height-based navigation:
 *   - Awaits a lightweight block header (fast, no tx list) for immediate SSR HTML.
 *   - Client-side React Query (`useBlockAt`) streams in the full block with transactions.
 *
 * For ID-based navigation:
 *   - No header-only endpoint exists — awaits the full block as before.
 */
interface LoaderData {
  block: IBlock | null;
}

export async function loader({ request }: { request: Request }): Promise<LoaderData> {
  const params = new URL(request.url).searchParams;
  const height = params.get('height');
  const id = params.get('id');
  if (!height && !id) return { block: null };

  if (height) {
    // Fast path: fetch only the block header (no transaction list) for initial SSR HTML.
    // The full block (with transactions) is hydrated client-side by useBlockAt().
    const heightNum = parseInt(height, 10);
    const headers = await fetchBlockHeadersSeq(heightNum, heightNum).catch(() => []);
    const header = headers[0] ?? null;
    if (!header) throw data('Block not found', { status: 404 });
    return { block: header as unknown as IBlock };
  }

  // ID path: no header-only endpoint — fetch full block.
  const block = id ? await fetchBlockById(id).catch(() => null) : null;
  if (!block) throw data('Block not found', { status: 404 });
  return { block };
}

export function ErrorBoundary() {
  return (
    <RouteError
      notFoundTitle="Block Not Found"
      notFoundDescription="No block with that height or ID exists on DecentralChain. Please check the value and try again."
    />
  );
}

export function meta({ data }: { data?: LoaderData }) {
  if (!data?.block) return [{ title: 'Block — DecentralScan' }];
  const height = data.block.height?.toLocaleString() ?? 'N/A';
  const generator = (data.block as IBlock).generator ?? '';
  const txCount = data.block.transactionCount ?? 0;
  const title = `Block #${height} — DecentralScan`;
  const description = `Block at height ${height} on DecentralChain. Generator: ${generator || 'N/A'}, Transactions: ${txCount}.`;
  return [
    { title },
    { content: description, name: 'description' },
    { content: title, property: 'og:title' },
    { content: description, property: 'og:description' },
    { content: 'website', property: 'og:type' },
    { content: '/og-image.png', property: 'og:image' },
    { content: 'summary', name: 'twitter:card' },
    { content: title, name: 'twitter:title' },
    { content: description, name: 'twitter:description' },
  ];
}

export default function BlockDetail() {
  const { block: serverBlock } = useLoaderData() as LoaderData;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const height = searchParams.get('height');
  const id = searchParams.get('id');

  const heightNum = height ? parseInt(height, 10) : null;
  const blockByHeight = useBlockAt(id ? null : heightNum);
  const blockById = useBlockById(height ? null : id);

  const queryResult = id ? blockById : blockByHeight;
  const { isLoading, error } = queryResult;
  const block = queryResult.data ?? serverBlock ?? null;

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
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
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-4xl font-bold text-foreground">Block Details</h1>
          {block && (
            <p className="text-muted-foreground mt-1">
              Height: {block.height?.toLocaleString() || 'N/A'}
            </p>
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
                  <p className="text-sm text-muted-foreground mb-2">Block Height</p>
                  <p className="text-2xl font-bold">{block.height?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Timestamp</p>
                  <p className="font-semibold">{fromUnix(block.timestamp)}</p>
                  <p className="text-sm text-muted-foreground">
                    {block.timestamp ? new Date(block.timestamp).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Block Signature</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted p-2 rounded flex-1 overflow-x-auto">
                      {block.signature || 'N/A'}
                    </code>
                    {block.signature && (
                      <CopyButton text={block.signature} label="Copy signature" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Version</p>
                  <Badge>{block.version || 'N/A'}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Transactions</p>
                  <p className="font-semibold">{block.transactionCount || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Block Size</p>
                  <p className="font-semibold">{(block.blocksize || 0).toLocaleString()} bytes</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Reward</p>
                  <p className="font-semibold">{block.reward || 0} DC</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-muted-foreground mb-2">Generator</p>
                  {block.generator ? (
                    <Link
                      to={createPageUrl('Address', `?addr=${block.generator}`)}
                      className="text-link hover:text-link-hover font-mono text-sm"
                    >
                      {block.generator}
                    </Link>
                  ) : (
                    <p className="text-muted-foreground">N/A</p>
                  )}
                </div>
                {block.reference && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">Parent Block</p>
                    <Link
                      to={createPageUrl('BlockDetail', `?id=${block.reference}`)}
                      className="text-link hover:text-link-hover font-mono text-sm"
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
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <Link
                          to={createPageUrl('Transaction', `?id=${tx.id}`)}
                          className="text-link hover:text-link-hover font-mono text-sm"
                        >
                          {truncate(tx.id, 16)}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">Type: {tx.type}</p>
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
              <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
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
