import { addBreadcrumb } from '@sentry/browser';
import { useEffect, useRef } from 'react';
import { type Location } from 'react-router-dom';

export function useSentryNavigationBreadcrumbs(location: Location) {
  const prevPageRef = useRef<string | null>(null);

  useEffect(() => {
    const currentPage = location.pathname + location.search + location.hash;
    const prevPage = prevPageRef.current;

    if (currentPage === prevPage) {
      return;
    }

    addBreadcrumb({
      category: 'navigation',
      data: {
        from: prevPage,
        to: currentPage,
      },
      level: 'info',
      type: 'navigation',
    });

    prevPageRef.current = currentPage;
  }, [location]);
}
