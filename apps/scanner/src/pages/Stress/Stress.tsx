/**
 * Stress Test Monitor — /stress
 *
 * A read-only dashboard that monitors live testnet chain activity.
 * No wallet or signing required — pure observation.
 *
 * Layout: 3-column grid
 *   Left  — Chain Pulse (auto-refreshes every 3s)
 *   Center — Mass Transfer Feed (auto-refreshes every 5s)
 *   Right  — Performance Charts (TPS line + block-time bar)
 */
import { Activity } from 'lucide-react';
import { ChainPulse } from './components/ChainPulse';
import { MassTransferFeed } from './components/MassTransferFeed';
import { PerformanceCharts } from './components/PerformanceCharts';

export default function Stress() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
          <Activity className="w-8 h-8 text-red-500" />
          Stress Test Monitor
        </h1>
        <p className="text-muted-foreground">
          Live read-only dashboard monitoring testnet chain activity — no wallet required.
        </p>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left — Chain Pulse */}
        <div>
          <ChainPulse />
        </div>

        {/* Center — Mass Transfer Feed */}
        <div className="lg:col-span-1">
          <MassTransferFeed />
        </div>

        {/* Right — Performance Charts */}
        <div>
          <PerformanceCharts />
        </div>
      </div>
    </div>
  );
}
