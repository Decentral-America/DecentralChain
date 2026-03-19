/**
 * Dashboard Page - Refactored Example
 *
 * Demonstrates clean architecture patterns:
 * - Custom hooks for state management
 * - Presentational components for rendering
 * - Clear separation of concerns
 */

import { Activity, Box, Clock, type LucideIcon, RefreshCw, Zap } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useLanguage } from '@/components/contexts/LanguageContext';
import CopyButton from '@/components/shared/CopyButton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { fromUnix, timeAgo, truncate } from '@/components/utils/formatters';
import { useBlockHeight, useLatestBlock } from '@/hooks/useBlockPolling';
import { useBlockHeaders } from '@/hooks/useBlocks';
import { useNodeVersion } from '@/hooks/useNode';
import { type IBlock, type IBlockHeader } from '@/lib/api';

/**
 * Props for the dashboard stat card component
 */
interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  gradient: string;
  badge?: string;
}

/**
 * Stat Card Component (pure presentation)
 */
function StatCard({ title, value, icon: Icon, gradient, badge }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow">
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${gradient} rounded-full opacity-10 transform translate-x-12 -translate-y-12`}
      />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2.5 rounded-xl ${gradient} bg-opacity-20`}>
            <Icon className={`w-5 h-5 ${gradient.replace('bg-', 'text-')}`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {badge && (
            <Badge variant="secondary" className="mb-1">
              {badge}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Latest Block Details Component (pure presentation)
 */
function LatestBlockDetail({ block }: { block: IBlock }) {
  const { t } = useLanguage();

  return (
    <Card className="border-none shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardTitle className="flex items-center gap-2">
          <Box className="w-5 h-5" />
          {t('latestBlock')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('blockId')}</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono">{truncate(block.signature, 12)}</code>
              <CopyButton text={block.signature} label={t('copyBlockId')} />
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('height')}</p>
            <Link
              to={`/blockdetail?height=${block.height}`}
              className="text-link hover:text-link-hover font-semibold"
            >
              {block.height.toLocaleString()}
            </Link>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('transactions')}</p>
            <p className="font-semibold">{block.transactionCount || 0}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">{t('timestamp')}</p>
            <p className="text-sm">{fromUnix(block.timestamp)}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-muted-foreground mb-1">{t('generator')}</p>
            <Link
              to={`/address?addr=${block.generator}`}
              className="text-link hover:text-link-hover text-sm font-mono"
            >
              {truncate(block.generator, 16)}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Recent Blocks Table Component (pure presentation)
 */
function RecentBlocksTable({ blocks, isLoading }: { blocks?: IBlockHeader[]; isLoading: boolean }) {
  const { t } = useLanguage();

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>{t('recentBlocks')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('height')}</TableHead>
                <TableHead>{t('blockId')}</TableHead>
                <TableHead>{t('time')}</TableHead>
                <TableHead>{t('generator')}</TableHead>
                <TableHead className="text-right">{t('txs')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 10 }, (_, i) => `skeleton-${i}`).map((skeletonKey) => (
                    <TableRow key={skeletonKey}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : blocks?.map((block) => (
                    <TableRow key={block.signature}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          to={`/blockdetail?height=${block.height}`}
                          className="text-link hover:text-link-hover"
                        >
                          {block.height}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {truncate(block.signature, 8)}
                      </TableCell>
                      <TableCell className="text-sm">{timeAgo(block.timestamp)}</TableCell>
                      <TableCell className="font-mono text-sm">
                        <Link
                          to={`/address?addr=${block.generator}`}
                          className="text-link hover:text-link-hover"
                        >
                          {truncate(block.generator, 10)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-sm">{block.transactionCount}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard Page Container
 *
 * Responsibilities:
 * - Manage page state (auto-refresh toggle)
 * - Call hooks to fetch data from services
 * - Compose sub-components
 * - Handle data transformation for presentation
 */
export default function Dashboard() {
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const { t } = useLanguage();

  // Data fetching via custom hooks
  const { data: height, isLoading: latestBlockLoading } = useBlockHeight(autoRefresh);
  const { data: latestBlock } = useLatestBlock(autoRefresh);
  const { data: nodeVersionData } = useNodeVersion();

  const currentHeight = height?.height || 0;
  const nodeVersion = nodeVersionData?.version ?? '...';

  // Fetch recent block headers (last 50)
  const from = Math.max(1, currentHeight - 49);
  const { data: blockHeaders, isLoading: headersLoading } = useBlockHeaders(from, currentHeight, {
    enabled: currentHeight > 0,
    refetchInterval: autoRefresh ? 15_000 : false,
  });

  return (
    <div className="space-y-8">
      {/* Header with auto-refresh control */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">{t('networkOverview')}</h1>
          <p className="text-muted-foreground">{t('realtimeStats')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground">
            {t('autoRefresh')}
          </Label>
          <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          {autoRefresh && <RefreshCw className="w-4 h-4 text-info animate-spin" />}
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title={t('currentHeight')}
          value={latestBlockLoading ? '...' : currentHeight.toLocaleString()}
          icon={Activity}
          gradient="bg-primary"
        />
        <StatCard
          title={t('nodeVersion')}
          value={nodeVersion}
          icon={Zap}
          gradient="bg-purple-600"
        />
        <StatCard
          title={t('lastBlock')}
          value={latestBlockLoading ? '...' : timeAgo(latestBlock?.timestamp || 0)}
          icon={Clock}
          gradient="bg-orange-600"
        />
      </div>

      {/* Latest Block Details */}
      {latestBlock && <LatestBlockDetail block={latestBlock} />}

      {/* Recent Blocks Table */}
      <RecentBlocksTable blocks={blockHeaders} isLoading={headersLoading} />
    </div>
  );
}
