import { useQuery } from '@tanstack/react-query';
import { Award, Globe, Leaf, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
// biome-ignore lint/suspicious/noDeprecatedImports: recharts marks Cell's internal CellReader context as deprecated; Cell itself is still the documented public API with no replacement
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  fetchConnectedPeers,
  fetchGeoForIp,
  fetchGreenCheck,
  type IAllConnectedResponse,
} from '@/lib/api';
import { type Peer } from '@/types';

type SustainabilityStats = {
  totalNodes: number;
  greenNodes: number;
  standardNodes: number;
  greenPercentage: number;
  hostingProviders: Record<string, number>;
  countriesData: Record<string, { total: number; green: number }>;
};

export default function Sustainability() {
  const [greenStats, setGreenStats] = useState<SustainabilityStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const { data: connected } = useQuery<IAllConnectedResponse>({
    queryFn: () => fetchConnectedPeers(),
    queryKey: ['peers', 'connected'],
  });

  useEffect(() => {
    const analyzeGreenHosting = async () => {
      if (!connected?.peers?.length) {
        setLoading(false);
        return;
      }

      setLoading(true);
      let greenCount = 0;
      let totalChecked = 0;
      const hostingProviders: Record<string, number> = {};
      const countriesData: Record<string, { total: number; green: number }> = {};

      for (const peer of connected.peers as Peer[]) {
        const address = peer.address || peer.declaredAddress;
        if (!address) continue;

        try {
          const ip = address.split('/')[1]?.split(':')[0];
          if (!ip) continue;

          const [greenData, geoData] = await Promise.all([fetchGreenCheck(ip), fetchGeoForIp(ip)]);

          totalChecked++;
          if (greenData.green) {
            greenCount++;
            const provider = greenData.hostedBy || 'Unknown';
            hostingProviders[provider] = (hostingProviders[provider] || 0) + 1;
          }

          const country = geoData.country || 'Unknown';

          if (!countriesData[country]) {
            countriesData[country] = { green: 0, total: 0 };
          }
          countriesData[country].total++;
          if (greenData.green) countriesData[country].green++;

          await new Promise((resolve) => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Failed to analyze peer:', error);
        }
      }

      const greenPercentage = totalChecked > 0 ? (greenCount / totalChecked) * 100 : 0;

      setGreenStats({
        countriesData,
        greenNodes: greenCount,
        greenPercentage,
        hostingProviders,
        standardNodes: totalChecked - greenCount,
        totalNodes: totalChecked,
      });
      setLoading(false);
    };

    void analyzeGreenHosting();
  }, [connected]);

  const pieData = greenStats
    ? [
        { color: '#22c55e', name: 'Green Hosting', value: greenStats.greenNodes },
        { color: '#94a3b8', name: 'Standard Hosting', value: greenStats.standardNodes },
      ]
    : [];

  const topProviders = greenStats
    ? Object.entries(greenStats.hostingProviders)
        .map(([name, count]) => ({ count, name }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    : [];

  const topGreenCountries = greenStats
    ? Object.entries(greenStats.countriesData)
        .map(([name, data]) => ({
          greenCount: data.green,
          greenPercentage: (data.green / data.total) * 100,
          name,
          total: data.total,
        }))
        .sort((a, b) => b.greenPercentage - a.greenPercentage)
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Leaf className="w-10 h-10 text-success" />
          Network Sustainability
        </h1>
        <p className="text-muted-foreground">
          Tracking renewable energy usage across DecentralChain network nodes
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Green Hosting %</p>
                <p className="text-3xl font-bold text-success">
                  {loading ? '...' : `${greenStats?.greenPercentage.toFixed(1)}%`}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-xl">
                <Leaf className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Green Nodes</p>
                <p className="text-3xl font-bold text-success">
                  {loading ? '...' : greenStats?.greenNodes || 0}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-xl">
                <Zap className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Analyzed</p>
                <p className="text-3xl font-bold text-foreground">
                  {loading ? '...' : greenStats?.totalNodes || 0}
                </p>
              </div>
              <div className="p-3 bg-info/10 rounded-xl">
                <Globe className="w-6 h-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-success" />
              Hosting Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Skeleton className="w-64 h-64 rounded-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name ?? ''}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-success" />
              Top Green Hosting Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }, (_, skeletonIndex) => `skeleton-${skeletonIndex}`).map(
                  (skeletonKey) => (
                    <Skeleton key={skeletonKey} className="h-12 w-full" />
                  ),
                )}
              </div>
            ) : topProviders.length > 0 ? (
              <div className="space-y-4">
                {topProviders.map((provider, index) => (
                  <div key={provider.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-success/10 text-success">#{index + 1}</Badge>
                      <span className="font-medium">{provider.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-success">{provider.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No green providers found</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Countries Ranking */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Top Countries by Green Hosting Adoption
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, skeletonIndex) => `skeleton-${skeletonIndex}`).map(
                (skeletonKey) => (
                  <Skeleton key={skeletonKey} className="h-16 w-full" />
                ),
              )}
            </div>
          ) : topGreenCountries.length > 0 ? (
            <div className="space-y-6">
              {topGreenCountries.map((country, index) => (
                <div key={country.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-success/10 text-success">#{index + 1}</Badge>
                      <span className="font-medium">{country.name}</span>
                      <span className="text-sm text-muted-foreground">
                        ({country.greenCount}/{country.total} nodes)
                      </span>
                    </div>
                    <span className="text-lg font-bold text-success">
                      {country.greenPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={country.greenPercentage} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-success/5 to-success/10">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-success/10 rounded-xl">
              <Leaf className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">About Green Hosting</h3>
              <p className="text-muted-foreground leading-relaxed">
                Green hosting indicates that the server infrastructure uses renewable energy sources
                or carbon offset programs. Data is verified by The Green Web Foundation, an
                independent organization tracking the environmental impact of the internet.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
