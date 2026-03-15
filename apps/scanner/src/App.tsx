import './App.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { type ComponentType, type ReactElement, type ReactNode, Suspense } from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { queryClientInstance } from '@/lib/query-client';
import PageNotFound from './lib/PageNotFound';
import { type PageName, pagesConfig } from './pages.config';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey: PageName = mainPage ?? (Object.keys(Pages)[0] as PageName);
const MainPage = mainPageKey ? Pages[mainPageKey] : null;

const PageSuspense = ({ children }: { children: ReactNode }): ReactElement => (
  <Suspense
    fallback={
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    }
  >
    {children}
  </Suspense>
);

const LayoutWrapper = ({
  children,
  currentPageName,
}: {
  children: ReactNode;
  currentPageName?: PageName;
}): ReactNode =>
  Layout ? <Layout currentPageName={currentPageName}>{children}</Layout> : children;

const wrapRoute = (path: PageName, Page: ComponentType | null): ReactNode => (
  <LayoutWrapper currentPageName={path}>
    <PageSuspense>{Page ? <Page /> : null}</PageSuspense>
  </LayoutWrapper>
);

function App(): ReactElement {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <Routes>
              <Route path="/" element={wrapRoute(mainPageKey, MainPage)} />
              {Object.entries(Pages).map(([path, Page]) => (
                <Route key={path} path={`/${path}`} element={wrapRoute(path as PageName, Page)} />
              ))}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
