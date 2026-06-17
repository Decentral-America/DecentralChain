/**
 * Renders a number with the user's locale — but only after client hydration.
 *
 * Server-side: renders with 'en-US' so SSR HTML is deterministic and matches
 * the initial client render, preventing React hydration error #418.
 *
 * Client-side: after hydration useEffect fires and re-renders with the user's
 * actual browser locale (undefined = system locale).
 */
import { useEffect, useState } from 'react';

interface ClientNumberProps {
  value: number | null | undefined;
  options?: Intl.NumberFormatOptions;
  className?: string;
  fallback?: string;
}

export function ClientNumber({ value, options, className, fallback = '—' }: ClientNumberProps) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    if (value == null) return;
    setFormatted(value.toLocaleString(undefined, options));
  }, [value, options]);

  if (value == null) return <span className={className}>{fallback}</span>;

  // Before hydration: en-US (matches server). After: user locale.
  const display = formatted ?? value.toLocaleString('en-US', options);
  return <span className={className}>{display}</span>;
}
