import { Activity, LogOut, Menu, Server, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigation, useRouteLoaderData } from 'react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { icon: <Server className="h-4 w-4" />, label: 'Nodes', to: '/' },
  { icon: <Activity className="h-4 w-4" />, label: 'Load Test', to: '/load-test' },
  { icon: <Wallet className="h-4 w-4" />, label: 'Treasury', to: '/treasury' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  const root = useRouteLoaderData('root') as { user: string | null; logoutUrl: string } | undefined;

  const logoutHref = root?.logoutUrl ?? '/';

  const sidebar = (
    <nav className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          DCC Node Dashboard
        </p>
      </div>

      <ul className="flex-1 px-2 py-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }: { isActive: boolean }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="p-4 border-t border-border space-y-2">
        {root?.user && (
          <p className="text-xs text-muted-foreground truncate px-1" title={root.user}>
            {root.user}
          </p>
        )}
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2" asChild>
          <a href={logoutHref}>
            <LogOut className="h-4 w-4" />
            Sign out
          </a>
        </Button>
      </div>
    </nav>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r border-border bg-sidebar">
        {sidebar}
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-black/50 cursor-default"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative z-50 w-60 h-full flex flex-col bg-sidebar border-r border-border">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <span className="font-semibold text-sm">DCC Node Dashboard</span>
        </header>

        <main
          className={cn(
            'flex-1 overflow-auto transition-opacity',
            isLoading && 'opacity-60 pointer-events-none',
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
