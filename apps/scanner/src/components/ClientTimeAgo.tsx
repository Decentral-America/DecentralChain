/**
 * Renders a relative timestamp ("2h ago") but only after client hydration.
 *
 * Server-side: renders the absolute timestamp so SSR HTML matches the
 * initial client render — preventing React hydration error #418.
 *
 * Client-side: replaces the absolute timestamp with the relative form
 * and refreshes every 30 seconds.
 */
import { useEffect, useState } from 'react';
import { fromUnix, timeAgo } from '@/components/utils/formatters';

interface ClientTimeAgoProps {
  timestamp: number | null | undefined;
  className?: string;
}

export function ClientTimeAgo({ timestamp, className }: ClientTimeAgoProps) {
  const [relative, setRelative] = useState<string | null>(null);

  useEffect(() => {
    if (!timestamp) return;
    setRelative(timeAgo(timestamp));
    const id = setInterval(() => setRelative(timeAgo(timestamp)), 30_000);
    return () => clearInterval(id);
  }, [timestamp]);

  // Before hydration: render absolute time so server HTML matches.
  // After hydration: render relative time.
  return <span className={className}>{relative ?? fromUnix(timestamp)}</span>;
}
