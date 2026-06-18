import { BarChart3, Zap } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useBlockTimings } from '../hooks/useBlockTimings';

export function PerformanceCharts() {
  const { data: timings, isLoading } = useBlockTimings();

  const tpsData = timings.map((t) => ({
    height: t.height,
    tps: Number(t.tps.toFixed(3)),
  }));

  const blockTimeData = timings.map((t) => ({
    blockTimeMs: t.blockTimeMs,
    height: t.height,
  }));

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* TPS chart */}
      <Card className="border-none shadow-lg flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-4 h-4 text-purple-500" />
            TPS (tx / block time) — last 20 blocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer height={200} width="100%">
              <LineChart data={tpsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="height" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v) => [`${v}`, 'TPS']} />
                <Line
                  dataKey="tps"
                  dot={{ r: 3 }}
                  name="TPS"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  type="monotone"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Block time chart */}
      <Card className="border-none shadow-lg flex-1">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="w-4 h-4 text-orange-500" />
            Block Time (ms) — last 20 blocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <ResponsiveContainer height={200} width="100%">
              <BarChart data={blockTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="height" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}`} />
                <YAxis tick={{ fontSize: 10 }} unit="ms" />
                <Tooltip formatter={(v) => [`${v} ms`, 'Block time']} />
                <Bar dataKey="blockTimeMs" fill="#f97316" name="Block time" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
