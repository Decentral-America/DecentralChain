import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
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
import { fetchBlockHeadersSeq, fetchHeight } from '@/lib/api';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../components/contexts/LanguageContext';
import CopyButton from '../components/shared/CopyButton';
import { fromUnix, truncate } from '../components/utils/formatters';

export default function Blocks() {
  const { t } = useLanguage();

  const { data: height } = useQuery({
    queryFn: () => fetchHeight(),
    queryKey: ['height'],
  });

  const currentHeight = height?.height || 0;
  const [pageSize] = useState(50);
  const [fromHeight, setFromHeight] = useState(Math.max(1, currentHeight - pageSize + 1));

  const toHeight = Math.min(currentHeight, fromHeight + pageSize - 1);

  const { data: blocks, isLoading } = useQuery({
    enabled: currentHeight > 0,
    queryFn: () => fetchBlockHeadersSeq(fromHeight, toHeight),
    queryKey: ['blockHeaders', fromHeight, toHeight],
  });

  const goToPage = (direction: 'first' | 'prev' | 'next' | 'last') => {
    if (direction === 'first') {
      setFromHeight(1);
    } else if (direction === 'prev') {
      setFromHeight(Math.max(1, fromHeight - pageSize));
    } else if (direction === 'next') {
      setFromHeight(Math.min(currentHeight - pageSize + 1, fromHeight + pageSize));
    } else if (direction === 'last') {
      setFromHeight(Math.max(1, currentHeight - pageSize + 1));
    }
  };

  const canGoPrev = fromHeight > 1;
  const canGoNext = toHeight < currentHeight;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('blocks')}</h1>
        <p className="text-gray-600">{t('blockExplorer')}</p>
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>{t('blockExplorer')}</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {t('showingBlocks')} {fromHeight.toLocaleString()} - {toHeight.toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('height')}</TableHead>
                  <TableHead>{t('blockId')}</TableHead>
                  <TableHead>{t('timestamp')}</TableHead>
                  <TableHead>{t('generator')}</TableHead>
                  <TableHead className="text-right">{t('transactions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading
                  ? Array.from(
                      { length: 10 },
                      (_, skeletonIndex) => `skeleton-${skeletonIndex}`,
                    ).map((skeletonKey) => (
                      <TableRow key={skeletonKey}>
                        <TableCell>
                          <Skeleton className="h-4 w-16" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-40" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-8 ml-auto" />
                        </TableCell>
                      </TableRow>
                    ))
                  : blocks
                      ?.slice()
                      .reverse()
                      .map((block) => (
                        <TableRow
                          key={block.signature}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() =>
                            (window.location.href = createPageUrl(
                              'BlockDetail',
                              `?height=${block.height}`,
                            ))
                          }
                        >
                          <TableCell className="font-semibold">
                            <Link
                              to={createPageUrl('BlockDetail', `?height=${block.height}`)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              {block.height.toLocaleString()}
                            </Link>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="text-sm">{truncate(block.signature, 16)}</code>
                              <CopyButton text={block.signature} />
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {fromUnix(block.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Link
                              to={createPageUrl('Address', `?addr=${block.generator}`)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-mono"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {truncate(block.generator, 12)}
                            </Link>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {block.transactionCount || 0}
                          </TableCell>
                        </TableRow>
                      ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="border-t p-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage('first')}
                disabled={!canGoPrev}
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage('prev')}
                disabled={!canGoPrev}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                {t('previous')}
              </Button>
            </div>

            <span className="text-sm text-gray-600">
              {t('pageOf')
                .replace(
                  '{current}',
                  (Math.floor((fromHeight - 1) / pageSize) + 1).toLocaleString(),
                )
                .replace('{total}', Math.ceil(currentHeight / pageSize).toLocaleString())}
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage('next')}
                disabled={!canGoNext}
              >
                {t('next')}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage('last')}
                disabled={!canGoNext}
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
