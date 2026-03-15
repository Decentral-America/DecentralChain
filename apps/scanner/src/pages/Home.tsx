import { Activity, ArrowRight, BarChart3, Box, Coins, Globe, Search } from 'lucide-react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { useLanguage } from '../components/contexts/LanguageContext';
import SearchBar from '../components/shared/SearchBar';

const features = [
  {
    desc: 'Browse blocks, transactions, and addresses on the DecentralChain network.',
    icon: Box,
    link: 'Blocks',
    title: 'Block Explorer',
  },
  {
    desc: 'Watch new blocks being forged in real time with auto-refresh.',
    icon: Activity,
    link: 'BlockFeed',
    title: 'Live Block Feed',
  },
  {
    desc: 'Explore tokens, NFTs, and asset distributions across the network.',
    icon: Coins,
    link: 'Asset',
    title: 'Asset Explorer',
  },
  {
    desc: 'Detailed charts on block times, transactions, and network health.',
    icon: BarChart3,
    link: 'NetworkStatistics',
    title: 'Network Statistics',
  },
  {
    desc: 'Visualize the global distribution of DecentralChain nodes.',
    icon: Globe,
    link: 'NetworkMap',
    title: 'Network Map',
  },
  {
    desc: 'Analyze token holder distribution with whale/shrimp breakdowns.',
    icon: Search,
    link: 'DistributionTool',
    title: 'Distribution Tool',
  },
];

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
          {t('appName')}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('appSubtitle')} — Search blocks, transactions, addresses, and assets on the
          DecentralChain network.
        </p>
        <div className="max-w-xl mx-auto">
          <SearchBar />
        </div>
        <div className="flex gap-3 justify-center pt-2">
          <Button asChild size="lg">
            <Link to={createPageUrl('Dashboard')}>
              Open Dashboard
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features grid */}
      <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <h2 className="sr-only">Features</h2>
        {features.map((f) => (
          <Link key={f.link} to={createPageUrl(f.link)} className="group">
            <Card className="h-full hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{f.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
