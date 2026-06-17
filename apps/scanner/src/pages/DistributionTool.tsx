import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  Info,
  Loader2,
  Search,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import {
  type FullDistribution,
  fetchAssetDetailsById,
  fetchFullAssetDistribution,
  fetchHeight,
  type TAssetDetails,
} from '@/lib/api';
import { type SortConfig as BaseSortConfig } from '@/types';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../components/contexts/LanguageContext';
import AssetLogo from '../components/shared/AssetLogo';
import CopyButton from '../components/shared/CopyButton';

import { formatAmount, truncate } from '../components/utils/formatters';

// Holder Tiers with emojis
const TIERS = {
  DOLPHIN: { color: 'text-sky-600', emoji: '🐬', name: 'Dolphin', threshold: 0.0001 },
  SHARK: { color: 'text-indigo-600', emoji: '🦈', name: 'Shark', threshold: 0.001 },
  SHRIMP: { color: 'text-muted-foreground', emoji: '🦐', name: 'Shrimp', threshold: 0 },
  WHALE: { color: 'text-info', emoji: '🐋', name: 'Whale', threshold: 0.01 },
};

const PAGE_SIZE = 25;
const HEIGHT_BUFFER = 10;
const MAX_ROLLBACK = 2000;

type HolderRow = {
  rank: number;
  address: string;
  balance: bigint;
  percentage: number;
  cumulative: number;
};

type HolderSortKey = 'rank' | 'balance' | 'percentage' | 'cumulative';

type HolderSortConfig = BaseSortConfig & {
  key: HolderSortKey;
};

type ProcessedDistributionData = {
  holders: HolderRow[];
  stats: {
    holderCount: number;
    top10Ownership: number;
    tierCounts: Record<'WHALE' | 'SHARK' | 'DOLPHIN' | 'SHRIMP', number>;
    gini: number;
  };
};

export default function DistributionTool() {
  const { t } = useLanguage();
  const location = useLocation();
  const initialAssetId = new URLSearchParams(location.search).get('assetId') || '';

  const [assetId, setAssetId] = useState<string>(initialAssetId);
  const [heightInput, setHeightInput] = useState<string>('');
  const [submittedAssetId, setSubmittedAssetId] = useState<string | null>(null);
  const [submittedHeight, setSubmittedHeight] = useState<number | null>(null);
  const [fetchProgress, setFetchProgress] = useState<{
    pages: number;
    holders: number;
    hasMore: boolean;
  }>({ hasMore: false, holders: 0, pages: 0 });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<HolderSortConfig>({
    direction: 'desc',
    key: 'balance',
  });
  const [currentPage, setCurrentPage] = useState<number>(1);

  const { data: latestHeightData, isLoading: heightLoading } = useQuery({
    queryFn: () => fetchHeight(),
    queryKey: ['height'],
  });
  const latestHeight = latestHeightData?.height || 0;

  const {
    data: assetData,
    isLoading: assetLoading,
    error: assetError,
  } = useQuery<TAssetDetails>({
    enabled: !!submittedAssetId,
    queryFn: () => fetchAssetDetailsById(submittedAssetId as string),
    queryKey: ['asset', submittedAssetId],
  });

  const {
    data: distributionData,
    isLoading: distributionLoading,
    error: distributionError,
  } = useQuery<FullDistribution>({
    enabled: !!submittedAssetId && !!submittedHeight,
    queryFn: () =>
      fetchFullAssetDistribution(
        submittedAssetId as string,
        submittedHeight as number,
        (pages, holders, hasMore) => {
          setFetchProgress({ hasMore, holders, pages });
        },
      ),
    queryKey: ['distribution', submittedAssetId, submittedHeight],
    retry: false,
  });

  const handleFetch = (): void => {
    if (!assetId || !latestHeight) {
      if (!latestHeight) {
        alert(t('alertWaitForHeight'));
      }
      return;
    }

    let heightToUse: number;
    const safeMaxHeight = Math.max(1, latestHeight - HEIGHT_BUFFER);
    const absoluteMinHeight = Math.max(1, latestHeight - MAX_ROLLBACK);

    if (heightInput) {
      const inputHeight = Number.parseInt(heightInput, 10);

      if (inputHeight > safeMaxHeight) {
        alert(
          t('alertHeightTooRecent')
            .replace('{inputHeight}', String(inputHeight))
            .replace('{buffer}', String(HEIGHT_BUFFER))
            .replace('{current}', String(latestHeight))
            .replace('{safeMaxHeight}', String(safeMaxHeight)),
        );
        return;
      }
      if (inputHeight < absoluteMinHeight) {
        alert(
          t('alertHeightTooOld')
            .replace('{inputHeight}', String(inputHeight))
            .replace('{maxRollback}', String(MAX_ROLLBACK))
            .replace('{absoluteMinHeight}', String(absoluteMinHeight)),
        );
        return;
      }
      if (inputHeight < 1) {
        alert(t('alertHeightMinOne'));
        return;
      }
      heightToUse = inputHeight;
    } else {
      heightToUse = safeMaxHeight;
    }

    setSubmittedHeight(heightToUse);
    setSubmittedAssetId(assetId);
    setCurrentPage(1);
    setFetchProgress({ hasMore: false, holders: 0, pages: 0 });
  };

  const processedData = useMemo<ProcessedDistributionData | null>(() => {
    if (!distributionData?.items || !assetData) return null;

    const holders = Object.entries(distributionData.items).map(([address, balance], index) => {
      const balanceBigInt = BigInt(balance);
      const totalSupplyBigInt = BigInt(assetData.quantity);
      const percentage =
        totalSupplyBigInt > 0 ? Number((balanceBigInt * 1000000n) / totalSupplyBigInt) / 10000 : 0;
      return { address, balance: balanceBigInt, percentage, rank: index + 1 };
    });

    holders.sort((a, b) => (b.balance > a.balance ? 1 : -1));

    let cumulative = 0;
    const rankedHolders = holders.map((holder, index) => {
      cumulative += holder.percentage;
      return { ...holder, cumulative: cumulative, rank: index + 1 };
    });

    // Tier analysis
    const tierCounts: Record<'WHALE' | 'SHARK' | 'DOLPHIN' | 'SHRIMP', number> = {
      DOLPHIN: 0,
      SHARK: 0,
      SHRIMP: 0,
      WHALE: 0,
    };
    rankedHolders.forEach((h) => {
      if (h.percentage >= TIERS.WHALE.threshold) tierCounts.WHALE++;
      else if (h.percentage >= TIERS.SHARK.threshold) tierCounts.SHARK++;
      else if (h.percentage >= TIERS.DOLPHIN.threshold) tierCounts.DOLPHIN++;
      else tierCounts.SHRIMP++;
    });

    // Gini Coefficient
    let giniNumerator = 0n;
    for (let i = 0; i < rankedHolders.length; i++) {
      for (let j = 0; j < rankedHolders.length; j++) {
        const left = rankedHolders[i];
        const right = rankedHolders[j];
        if (!left || !right) continue;
        giniNumerator += BigInt(Math.abs(Number(left.balance - right.balance)));
      }
    }
    const giniDenominator = 2n * BigInt(rankedHolders.length) * BigInt(assetData.quantity);
    const gini =
      giniDenominator > 0n ? Number((giniNumerator * 10000n) / giniDenominator) / 10000 : 0;

    return {
      holders: rankedHolders,
      stats: {
        gini,
        holderCount: rankedHolders.length,
        tierCounts,
        top10Ownership: rankedHolders.slice(0, 10).reduce((acc, h) => acc + h.percentage, 0),
      },
    };
  }, [distributionData, assetData]);

  const sortedAndFilteredData = useMemo<HolderRow[]>(() => {
    if (!processedData) return [];
    let data = [...processedData.holders];
    if (searchTerm) {
      data = data.filter((h) => h.address.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    data.sort((a, b) => {
      const valA = a[sortConfig.key as keyof HolderRow];
      const valB = b[sortConfig.key as keyof HolderRow];
      if (typeof valA === 'bigint' && typeof valB === 'bigint') {
        return sortConfig.direction === 'asc' ? (valA > valB ? 1 : -1) : valA < valB ? 1 : -1;
      }
      if (sortConfig.direction === 'asc') {
        return valA > valB ? 1 : -1;
      }
      return valA < valB ? 1 : -1;
    });
    return data;
  }, [processedData, searchTerm, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedAndFilteredData.slice(start, start + PAGE_SIZE);
  }, [sortedAndFilteredData, currentPage]);

  const totalPages = Math.ceil(sortedAndFilteredData.length / PAGE_SIZE);

  const requestSort = (key: HolderSortKey): void => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ direction, key });
    setCurrentPage(1);
  };

  const download = (filename: string, text: string, mime: string): void => {
    const element = document.createElement('a');
    element.setAttribute('href', `data:${mime};charset=utf-8,${encodeURIComponent(text)}`);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportCSV = (): void => {
    if (!processedData || !assetData) return;
    const headers = `${t('rank')},${t('address')},${t('balanceRaw')},${t('balanceHuman')},${t('supplyPercent')},${t('cumulativePercent')}`;
    const rows = processedData.holders
      .map(
        (h) =>
          `${h.rank},${h.address},${h.balance.toString()},${formatAmount(h.balance, assetData.decimals)},${h.percentage.toFixed(6)},${h.cumulative.toFixed(6)}`,
      )
      .join('\n');
    download(`${assetId}_distribution.csv`, `${headers}\n${rows}`, 'text/csv');
  };

  const handleExportJSON = (): void => {
    if (!processedData) return;
    download(
      `${assetId}_distribution.json`,
      JSON.stringify(
        processedData.holders,
        (_key: string, value: unknown) => (typeof value === 'bigint' ? value.toString() : value),
        2,
      ),
      'application/json',
    );
  };

  const isLoading = assetLoading || distributionLoading;
  const error = assetError || distributionError;
  const safeMaxHeight = Math.max(1, latestHeight - HEIGHT_BUFFER);
  const absoluteMinHeight = Math.max(1, latestHeight - MAX_ROLLBACK);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">{t('assetDistributionTool')}</h1>
          <p className="text-muted-foreground mt-1">{t('analyzeHolderDistribution')}</p>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>{t('comprehensiveAnalysis')}</AlertTitle>
        <AlertDescription>
          {t('fetchesAllHolders')}{' '}
          {t('forBestResults')
            .replace('{buffer}', String(HEIGHT_BUFFER))
            .replace('{current}', String(latestHeight || '...'))}
          {latestHeight &&
            ` ${t('validRange').replace('{min}', String(absoluteMinHeight)).replace('{max}', String(safeMaxHeight))}.`}
        </AlertDescription>
      </Alert>

      <Card className="border-none shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="asset-id" className="block text-sm font-medium text-foreground mb-1">
                {t('assetId')}
              </label>
              <Input
                id="asset-id"
                placeholder={t('enterAssetId')}
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <label htmlFor="height" className="block text-sm font-medium text-foreground mb-1">
                {t('heightOptional')}
              </label>
              <Input
                id="height"
                type="number"
                placeholder={
                  latestHeight
                    ? t('defaultHeightValue').replace('{height}', String(safeMaxHeight))
                    : t('loadingHeight')
                }
                value={heightInput}
                onChange={(e) => setHeightInput(e.target.value)}
                max={safeMaxHeight}
                min={absoluteMinHeight}
                disabled={heightLoading}
              />
            </div>
            <Button
              onClick={handleFetch}
              disabled={!assetId || isLoading || heightLoading || !latestHeight}
              className="w-full md:w-auto"
            >
              {heightLoading
                ? t('loadingHeight')
                : isLoading
                  ? t('fetching')
                  : t('fetchDistribution')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {distributionLoading && (
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="w-5 h-5 animate-spin text-info" />
              <div className="flex-1">
                <p className="font-medium text-foreground">{t('fetchingData')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('pagesFetched')
                    .replace('{pages}', String(fetchProgress.pages))
                    .replace('{holders}', fetchProgress.holders.toLocaleString())}
                  {fetchProgress.hasMore && ` • ${t('morePagesLoading')}`}
                </p>
              </div>
            </div>
            <Progress value={fetchProgress.hasMore ? 50 : 100} className="h-2" />
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('errorOccurred')}</AlertTitle>
          <AlertDescription>
            {(error instanceof Error ? error.message : '') || t('failedToFetchData')}
            {latestHeight && (
              <span className="block mt-2">
                <strong>{t('troubleshooting')}:</strong>
                <br />
                {t('useHeightOrOlder')
                  .replace('{height}', String(safeMaxHeight))
                  .replace('{min}', String(absoluteMinHeight))
                  .replace('{max}', String(safeMaxHeight))}
                <br />
                {t('ensureCorrectAssetId')}
                <br />
                {t('tryOlderHeight')
                  .replace('{buffer}', String(HEIGHT_BUFFER))
                  .replace('{current}', String(latestHeight))}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && !error && !distributionLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }, (_, skeletonIndex) => `skeleton-${skeletonIndex}`).map(
              (skeletonKey) => (
                <Skeleton key={skeletonKey} className="h-24 w-full" />
              ),
            )}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      )}

      {processedData && assetData && !isLoading && (
        <div className="space-y-6">
          {/* Meta and Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('asset')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 mb-2">
                  <AssetLogo assetId={assetData.assetId} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xl font-bold truncate">{assetData.name}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground font-mono truncate">
                  {truncate(assetData.assetId)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('supply')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatAmount(Number(assetData.quantity), Number(assetData.decimals))}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('snapshotAt').replace('{height}', String(submittedHeight))}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('totalHolders')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {processedData.stats.holderCount.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">{t('uniqueAddresses')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('giniCoefficient')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{processedData.stats.gini.toFixed(4)}</p>
                <p className="text-sm text-muted-foreground">
                  {processedData.stats.gini > 0.7
                    ? t('highConcentration')
                    : processedData.stats.gini > 0.4
                      ? t('mediumConcentration')
                      : t('lowConcentration')}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>{t('holderTiers')}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-around items-center text-center">
              {Object.values(TIERS).map((tier) => (
                <div key={tier.name}>
                  <div className="text-4xl mb-2">{tier.emoji}</div>
                  <p className="text-xl font-bold mt-2">
                    {
                      processedData.stats.tierCounts[
                        tier.name.toUpperCase() as keyof typeof processedData.stats.tierCounts
                      ]
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t(`${tier.name.toLowerCase()}s`)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="border-none shadow-lg">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>
                  {t('holderList')}{' '}
                  {t('totalInParens').replace(
                    '{total}',
                    processedData.stats.holderCount.toLocaleString(),
                  )}
                </CardTitle>
                <div className="flex gap-2 w-full md:w-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('searchAddress')}
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button variant="outline" onClick={handleExportJSON}>
                    <FileJson className="mr-2 h-4 w-4" />
                    JSON
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <Button variant="ghost" onClick={() => requestSort('rank')}>
                          {t('rank')} <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead>{t('address')}</TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => requestSort('balance')}>
                          {t('balance')} <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => requestSort('percentage')}>
                          {t('supplyPercent')} <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => requestSort('cumulative')}>
                          {t('cumulativePercent')} <ArrowUpDown className="ml-2 h-4 w-4" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.length > 0 ? (
                      paginatedData.map((h) => (
                        <TableRow key={h.address}>
                          <TableCell>{h.rank}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link
                                to={createPageUrl('Address', `?addr=${h.address}`)}
                                className="font-mono text-sm text-info"
                              >
                                {h.address}
                              </Link>
                              <CopyButton text={h.address} />
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatAmount(h.balance, assetData.decimals)}
                          </TableCell>
                          <TableCell className="text-right">{h.percentage.toFixed(4)}%</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {h.cumulative.toFixed(4)}%
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                          {t('noResultsFound')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {/* Pagination */}
              <div className="border-t p-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('showingHolders')
                    .replace(
                      '{from}',
                      String(
                        Math.min(1 + (currentPage - 1) * PAGE_SIZE, sortedAndFilteredData.length),
                      ),
                    )
                    .replace(
                      '{to}',
                      String(Math.min(currentPage * PAGE_SIZE, sortedAndFilteredData.length)),
                    )
                    .replace('{total}', String(sortedAndFilteredData.length))}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" /> {t('prev')}
                  </Button>
                  <span className="p-2 text-sm">
                    {t('pageOf')
                      .replace('{current}', String(currentPage))
                      .replace('{total}', String(totalPages))}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    {t('next')} <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
