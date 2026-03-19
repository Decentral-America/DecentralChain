import {
  ArrowUpDown,
  Box,
  Coins,
  Languages,
  LayoutDashboard,
  type LucideIcon,
  Menu,
  Moon,
  Network,
  Receipt,
  Sun,
  Wallet,
  X,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
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

function LayoutContent() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, changeLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  const navigationItems: NavigationItem[] = [
    { icon: LayoutDashboard, title: t('dashboard'), url: createPageUrl('Dashboard') },
    { icon: Box, title: t('blocks'), url: createPageUrl('Blocks') },
    { icon: Receipt, title: t('transactions'), url: createPageUrl('Transaction') },
    { icon: Wallet, title: t('address'), url: createPageUrl('Address') },
    { icon: Coins, title: t('assets'), url: createPageUrl('Asset') },
    { icon: ArrowUpDown, title: t('dexPairs'), url: createPageUrl('DexPairs') },
    { icon: Network, title: 'Network', url: createPageUrl('Network') },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:p-4 focus:bg-background focus:text-foreground"
      >
        Skip to main content
      </a>
      {/* Analytics Tracker - invisible component that tracks page views */}
      <AnalyticsTracker />

      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? 'bg-background/95 backdrop-blur-lg shadow-sm'
            : 'bg-background/80 backdrop-blur-md'
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
                <h1 className="text-lg font-bold text-foreground">{t('appName')}</h1>
                <p className="text-xs text-muted-foreground">{t('appSubtitle')}</p>
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
                    className={language === 'en' ? 'bg-accent' : ''}
                  >
                    🇺🇸 English
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => changeLanguage('es')}
                    className={language === 'es' ? 'bg-accent' : ''}
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
        <div className="hidden lg:block border-t bg-background/50">
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
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
          <div className="lg:hidden border-t bg-background">
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
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent'
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
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-background mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Box className="w-4 h-4" />
              <span>
                {t('appName')} {t('appSubtitle')}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Powered by DecentralChain Public API</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Layout() {
  return (
    <LanguageProvider>
      <LayoutContent />
    </LanguageProvider>
  );
}
