import {
  Activity,
  ArrowUpDown,
  BarChart3,
  Box,
  Clock,
  Coins,
  Globe,
  Languages,
  LayoutDashboard,
  Leaf,
  type LucideIcon,
  Menu,
  Moon,
  Network,
  Receipt,
  Server,
  Sun,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { type ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createPageUrl } from '@/utils';
import { LanguageProvider, useLanguage } from './components/contexts/LanguageContext';
import SearchBar from './components/shared/SearchBar';

// Stub: wire up real analytics (e.g. Sentry breadcrumb) when ready
const AnalyticsTracker = () => null;

interface NavigationItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

function LayoutContent({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, changeLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const navigationItems: NavigationItem[] = [
    { icon: LayoutDashboard, title: t('dashboard'), url: createPageUrl('Dashboard') },
    { icon: Box, title: t('blocks'), url: createPageUrl('Blocks') },
    { icon: Activity, title: t('blockFeed'), url: createPageUrl('BlockFeed') },
    { icon: Receipt, title: t('transactions'), url: createPageUrl('Transaction') },
    { icon: ArrowUpDown, title: t('dexPairs'), url: createPageUrl('DexPairs') },
    { icon: Clock, title: t('unconfirmed'), url: createPageUrl('UnconfirmedTransactions') },
    { icon: Wallet, title: t('address'), url: createPageUrl('Address') },
    { icon: Coins, title: t('assets'), url: createPageUrl('Asset') },
    { icon: Users, title: t('distribution'), url: createPageUrl('DistributionTool') },
    { icon: Network, title: t('transactionMap'), url: createPageUrl('TransactionMap') },
    { icon: BarChart3, title: t('networkStats'), url: createPageUrl('NetworkStatistics') },
    { icon: Globe, title: t('networkMap'), url: createPageUrl('NetworkMap') },
    { icon: Network, title: t('peers'), url: createPageUrl('Peers') },
    { icon: Leaf, title: 'Sustainability', url: createPageUrl('Sustainability') },
    { icon: Server, title: t('node'), url: createPageUrl('Node') },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-white focus:text-black"
      >
        Skip to main content
      </a>
      {/* Analytics Tracker - invisible component that tracks page views */}
      <AnalyticsTracker />

      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled ? 'bg-white/95 backdrop-blur-lg shadow-sm' : 'bg-white/80 backdrop-blur-md'
        }`}
      >
        {/* Top Row - Logo, Search, and Controls */}
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow overflow-hidden">
                <img
                  src="/favicon.svg"
                  alt="DecentralScan Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900">{t('appName')}</h1>
                <p className="text-xs text-gray-500">{t('appSubtitle')}</p>
              </div>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 mx-8 max-w-2xl">
              <SearchBar />
            </div>

            {/* User Menu / Sign In Button, Language Switcher & Mobile Menu Button */}
            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>

              {/* Language Switcher */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Languages className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => changeLanguage('en')}
                    className={language === 'en' ? 'bg-blue-50' : ''}
                  >
                    🇺🇸 English
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => changeLanguage('es')}
                    className={language === 'es' ? 'bg-blue-50' : ''}
                  >
                    🇪🇸 Español
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden pb-3">
            <SearchBar />
          </div>
        </div>

        {/* Navigation Tabs Row - Desktop */}
        <div className="hidden lg:block border-t bg-white/50">
          <div className="container mx-auto px-4">
            <nav
              aria-label="Main navigation"
              className="flex items-center gap-1 overflow-x-auto py-2"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    location.pathname === item.url
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <nav
              aria-label="Mobile navigation"
              className="container mx-auto px-4 py-4 grid grid-cols-2 gap-2"
            >
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === item.url
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="container mx-auto px-4 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Box className="w-4 h-4" />
              <span>
                {t('appName')} {t('appSubtitle')}
              </span>
            </div>
            <p className="text-sm text-gray-500">Powered by DecentralChain Public API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <LayoutContent>{children}</LayoutContent>
    </LanguageProvider>
  );
}
