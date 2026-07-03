/**
 * Generator Dashboard — /generator?addr=<address>
 *
 * Node owner view: generating balance, block production history,
 * earnings breakdown, active leases, estimated APY.
 * Read-only, no auth. All data from the DCC node REST API.
 */
import { Activity, Award, Coins, Cpu, TrendingUp, Zap } from 'lucide-react';
import { data, Link, useLoaderData } from 'react-router';
import RouteError from '@/components/RouteError';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  fetchActiveLeases,
  fetchBalanceDetails,
  fetchBlockHeadersSeq,
  fetchHeight,
  fetchRewards,
  type IBalanceDetails,
  type IBlockHeader,
  type IRewards,
} from '@/lib/api';
import { type Lease } from '@/types';
import { createPageUrl } from '@/utils';
import CopyButton from '../components/shared/CopyButton';
import { formatAmount, fromUnix, truncate } from '../components/utils/formatters';

// ── Types ────────────────────────────────────────────────────────────────────

interface EarningsSummary {
  blocksProduced: number;
  blockRewardTotal: bigint;
  feeTotal: bigint;
  sampleSize: number;
}

interface LoaderData {
  address: string;
  balance: IBalanceDetails<string | number>;
  rewards: IRewards;
  leases: Lease[];
  recentBlocks: IBlockHeader[];
  earnings: EarningsSummary;
  currentHeight: number;
}

// ── Loader ───────────────────────────────────────────────────────────────────

export async function loader({ request }: { request: Request }): Promise<LoaderData> {
  const addr = new URL(request.url).searchParams.get('addr');

  if (!addr) throw data('No address provided', { status: 400 });
  if (!/^3[1-9A-HJ-NP-Za-km-z]{34}$/.test(addr)) {
    throw data('Invalid address format', { status: 400 });
  }

  const [heightRes, balance, rewards, leases] = await Promise.all([
    fetchHeight(),
    fetchBalanceDetails(addr).catch(() => null),
    fetchRewards().catch(() => null),
    fetchActiveLeases(addr).catch(() => []),
  ]);

  if (!balance) throw data('Address not found', { status: 404 });

  const height = heightRes.height;

  // Fetch the last 100 block headers to compute earnings.
  // Node API returns up to 100 headers per request.
  const from = Math.max(1, height - 99);
  const headers = await fetchBlockHeadersSeq(from, height).catch(() => []);

  const recentBlocks = headers.filter((h) => h.generator === addr);

  const earnings: EarningsSummary = recentBlocks.reduce(
    (acc, h) => ({
      blockRewardTotal: acc.blockRewardTotal + BigInt(h.reward ?? 0),
      blocksProduced: acc.blocksProduced + 1,
      feeTotal: acc.feeTotal + BigInt(h.totalFee ?? 0),
      sampleSize: acc.sampleSize + 1,
    }),
    { blockRewardTotal: 0n, blocksProduced: 0, feeTotal: 0n, sampleSize: headers.length },
  );

  return {
    address: addr,
    balance,
    currentHeight: height,
    earnings,
    leases,
    recentBlocks: recentBlocks.slice(0, 20),
    rewards: rewards ?? {
      currentReward: 600_000_000,
      height: 0,
      minIncrement: 0,
      nextCheck: 0,
      term: 0,
      totalDccAmount: 0,
      votes: { decrease: 0, increase: 0 },
      votingInterval: 0,
      votingIntervalStart: 0,
      votingThreshold: 0,
    },
  };
}

// ── Error boundary ────────────────────────────────────────────────────────────

export function ErrorBoundary() {
  return (
    <RouteError
      notFoundTitle="Generator Not Found"
      notFoundDescription="No node with that address was found on DecentralChain. Please check the address and try again."
    />
  );
}

// ── Meta ──────────────────────────────────────────────────────────────────────

export function meta({ loaderData }: { loaderData?: LoaderData }) {
  if (!loaderData?.address) return [{ title: 'Generator — DecentralScan' }];
  const short = `${loaderData.address.slice(0, 8)}…`;
  return [
    { title: `Generator ${short} — DecentralScan` },
    {
      content: `Block production and earnings for DCC generator ${loaderData.address}`,
      name: 'description',
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Generator() {
  const { address, balance, rewards, leases, recentBlocks, earnings, currentHeight } =
    useLoaderData<LoaderData>();

  const generatingBalance = Number(balance.generating) / 1e8;
  const totalEarned = earnings.blockRewardTotal + earnings.feeTotal;

  // Estimate APY: average DCC earned per block across the sample (including blocks
  // this generator didn't produce) × blocks per year = expected annual earnings.
  // Dividing by sampleSize already accounts for participation rate — multiplying
  // by it again would double-penalise and produce ~50% of the correct value.
  const blocksPerYear = (365 * 24 * 3600) / 60; // ~525,600 at 60s block time
  const estimatedAnnualEarning =
    earnings.sampleSize > 0 ? (Number(totalEarned) / 1e8 / earnings.sampleSize) * blocksPerYear : 0;
  const estimatedApy =
    generatingBalance > 0 ? (estimatedAnnualEarning / generatingBalance) * 100 : 0;

  const participationRate =
    earnings.sampleSize > 0
      ? ((earnings.blocksProduced / earnings.sampleSize) * 100).toFixed(2)
      : '0.00';

  const currentRewardDcc = Number(rewards.currentReward) / 1e8;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-xs font-mono">
            GENERATOR
          </Badge>
        </div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3 flex-wrap break-all">
          <Cpu className="w-7 h-7 text-primary shrink-0" />
          <span className="font-mono text-lg sm:text-2xl">{address}</span>
          <CopyButton text={address} />
        </h1>
        <p className="text-muted-foreground mt-1">
          Block production &amp; earnings — last {earnings.sampleSize} blocks (height{' '}
          {currentHeight - earnings.sampleSize + 1}–{currentHeight})
        </p>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Coins className="w-5 h-5 text-blue-400" />}
          label="Generating Balance"
          value={`${formatAmount(balance.generating, 8)} DCC`}
          sub={`Effective: ${formatAmount(balance.effective, 8)} DCC`}
          color="blue"
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-green-400" />}
          label="Blocks Produced"
          value={earnings.blocksProduced.toString()}
          sub={`${participationRate}% of last ${earnings.sampleSize} blocks`}
          color="green"
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-yellow-400" />}
          label="Earned (last 100 blocks)"
          value={`${formatAmount(totalEarned.toString(), 8)} DCC`}
          sub={`Reward: ${formatAmount(earnings.blockRewardTotal.toString(), 8)} · Fees: ${formatAmount(earnings.feeTotal.toString(), 8)}`}
          color="yellow"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
          label="Estimated APY"
          value={`${estimatedApy.toFixed(2)}%`}
          sub={`Block reward: ${currentRewardDcc} DCC`}
          color="purple"
        />
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent blocks produced */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Recent Blocks Produced
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {recentBlocks.length === 0 ? (
                <p className="text-muted-foreground text-sm px-6 py-4">
                  No blocks produced in the last {earnings.sampleSize} block window.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Height</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead className="text-right">Reward</TableHead>
                        <TableHead className="text-right">Fees</TableHead>
                        <TableHead className="text-right">TXs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentBlocks.map((block) => (
                        <TableRow key={block.id}>
                          <TableCell>
                            <Link
                              to={createPageUrl('BlockDetail', `?height=${block.height}`)}
                              className="text-primary hover:underline font-mono text-sm"
                            >
                              {block.height}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {fromUnix(block.timestamp)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatAmount(block.reward, 8)} DCC
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">
                            {formatAmount(block.totalFee, 8)} DCC
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {block.transactionCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Balance breakdown */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Balance Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <BalanceRow label="Regular" value={formatAmount(balance.regular, 8)} />
              <BalanceRow label="Available" value={formatAmount(balance.available, 8)} />
              <BalanceRow label="Effective" value={formatAmount(balance.effective, 8)} />
              <BalanceRow
                label="Generating"
                value={formatAmount(balance.generating, 8)}
                highlight
              />
            </CardContent>
          </Card>

          {/* Outgoing leases */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Outgoing Leases</CardTitle>
            </CardHeader>
            <CardContent>
              {leases.length === 0 ? (
                <p className="text-muted-foreground text-sm">No active outgoing leases.</p>
              ) : (
                <div className="space-y-2">
                  {leases.slice(0, 10).map((lease) => (
                    <div key={lease.id} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground font-mono">
                        {truncate(lease.recipient, 6)}
                      </span>
                      <span className="font-mono">{formatAmount(lease.amount, 8)} DCC</span>
                    </div>
                  ))}
                  {leases.length > 10 && (
                    <p className="text-muted-foreground text-xs">+{leases.length - 10} more</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: 'blue' | 'green' | 'yellow' | 'purple';
}) {
  const bg = {
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    purple: 'bg-purple-500/10',
    yellow: 'bg-yellow-500/10',
  }[color];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-bold truncate">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1 truncate">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg shrink-0 ${bg}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function BalanceRow({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between text-sm ${highlight ? 'font-semibold' : ''}`}>
      <span className={highlight ? 'text-foreground' : 'text-muted-foreground'}>{label}</span>
      <span className="font-mono">{value} DCC</span>
    </div>
  );
}
