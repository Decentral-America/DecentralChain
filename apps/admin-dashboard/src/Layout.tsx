import {
  Activity,
  BarChart2,
  ClipboardList,
  GitBranch,
  Heart,
  HeartPulse,
  LogOut,
  Menu,
  Server,
  Settings2,
  TestTube2,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Form, NavLink, Outlet, useNavigation, useRouteLoaderData } from 'react-router';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── Nav structure ─────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  to: string;
  icon: React.ReactNode;
  end?: boolean;
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { end: true, icon: <Server className="h-4 w-4" />, label: 'Nodes', to: '/' },
      { icon: <Heart className="h-4 w-4" />, label: 'Chain Health', to: '/chain-health' },
      {
        icon: <BarChart2 className="h-4 w-4" />,
        label: 'Generator Perf.',
        to: '/generator-performance',
      },
      { icon: <HeartPulse className="h-4 w-4" />, label: 'Service Health', to: '/service-health' },
    ],
    section: 'Infrastructure',
  },
  {
    items: [
      { icon: <GitBranch className="h-4 w-4" />, label: 'CI/CD Status', to: '/ci-cd' },
      { icon: <Activity className="h-4 w-4" />, label: 'Load Test', to: '/load-test' },
      {
        icon: <ClipboardList className="h-4 w-4" />,
        label: 'Stress History',
        to: '/stress-history',
      },
      { icon: <TestTube2 className="h-4 w-4" />, label: 'E2E Runner', to: '/e2e' },
    ],
    section: 'Testing & Deploys',
  },
  {
    items: [{ icon: <Wallet className="h-4 w-4" />, label: 'Treasury', to: '/treasury' }],
    section: 'Treasury',
  },
  {
    items: [{ icon: <Settings2 className="h-4 w-4" />, label: 'Operations', to: '/operations' }],
    section: 'Operations',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === 'loading';

  const root = useRouteLoaderData('root') as { user: string | null } | undefined;

  const sidebar = (
    <nav className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-border">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          DCC Admin Dashboard
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.section}>
            <p className="px-3 mb-1 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest">
              {group.section}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
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
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-border space-y-2">
        {root?.user && (
          <p className="text-xs text-muted-foreground truncate px-1" title={root.user}>
            {root.user}
          </p>
        )}
        <Form method="post" action="/api/auth/logout">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </Form>
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
          <span className="font-semibold text-sm">DCC Admin Dashboard</span>
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
