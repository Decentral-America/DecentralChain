import { useQuery } from '@tanstack/react-query';
import { Activity, Database, type LucideIcon, Server, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchNodeStatus, fetchNodeVersion, type INodeStatus, type INodeVersion } from '@/lib/api';
import { useLanguage } from '../components/contexts/LanguageContext';

export default function Node() {
  const { t } = useLanguage();

  const { data: status, isLoading: statusLoading } = useQuery<INodeStatus>({
    queryFn: () => fetchNodeStatus(),
    queryKey: ['nodeStatus'],
  });

  const { data: version, isLoading: versionLoading } = useQuery<INodeVersion>({
    queryFn: () => fetchNodeVersion(),
    queryKey: ['nodeVersion'],
  });

  const InfoCard = ({
    title,
    value,
    icon: Icon,
    badge,
  }: {
    title: string;
    value: string;
    icon: LucideIcon;
    badge?: string;
  }) => (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-2">{title}</p>
            {statusLoading || versionLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {badge && <Badge className="mt-2">{badge}</Badge>}
          </div>
          <div className="p-3 bg-blue-100 rounded-xl">
            <Icon className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('nodeInformationTitle')}</h1>
        <p className="text-gray-600">{t('viewNodeStatus')}</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <InfoCard title={t('nodeVersion')} value={version?.version || 'N/A'} icon={Server} />
        <InfoCard
          title={t('stateHeight')}
          value={status?.stateHeight?.toLocaleString() || 'N/A'}
          icon={Activity}
        />
        <InfoCard
          title={t('blockGeneratorStatus')}
          value={status?.blockGeneratorStatus || 'N/A'}
          icon={Zap}
          badge={status?.blockGeneratorStatus === 'active' ? t('active') : t('inactive')}
        />
        <InfoCard
          title={t('historyReplier')}
          value={status?.historyReplierEnabled ? t('enabled') : t('disabled')}
          icon={Database}
        />
      </div>

      {/* Detailed Status */}
      <Card className="border-none shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            {t('nodeStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {statusLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }, (_, skeletonIndex) => `skeleton-${skeletonIndex}`).map(
                (skeletonKey) => (
                  <div key={skeletonKey}>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('blockchainHeight')}</p>
                <p className="font-semibold text-lg">
                  {status?.blockchainHeight?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('stateHeight')}</p>
                <p className="font-semibold text-lg">
                  {status?.stateHeight?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('updatedTimestamp')}</p>
                <p className="font-semibold">
                  {status?.updatedTimestamp
                    ? new Date(status.updatedTimestamp).toLocaleString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('updatedDate')}</p>
                <p className="font-semibold">
                  {status?.updatedDate ? new Date(status.updatedDate).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw JSON */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>{t('rawNodeData')}</CardTitle>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify({ status, version }, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
