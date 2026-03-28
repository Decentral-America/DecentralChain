import { format, formatDistance, formatRelative, isValid, type Locale, parseISO } from 'date-fns';
import { de, enUS, es, fr, hi, it, ja, ko, nl, pl, pt, ru, tr, zhCN } from 'date-fns/locale';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { logger } from '@/lib/logger';

/**
 * DateDisplay Component
 *
 * A flexible date/time formatting component with:
 * - Multiple format options (absolute, relative, calendar)
 * - Locale support via date-fns
 * - Integration with i18n
 * - Tooltip with full timestamp
 * - Auto-updating for relative times
 */

// Styled Components
const DateText = styled.span<{ size?: 'small' | 'medium' | 'large' }>`
  font-size: ${({ size }) => {
    switch (size) {
      case 'small':
        return '12px';
      case 'large':
        return '16px';
      default:
        return '14px';
    }
  }};
  color: ${({ theme }) => theme.colors.text};
  cursor: default;
`;

const DateWithTooltip = styled.span`
  position: relative;
  cursor: help;

  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
    background-color: ${({ theme }) => theme.colors.text};
    color: ${({ theme }) => theme.colors.background};
    border-radius: 6px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 1000;
    pointer-events: none;
    margin-bottom: 4px;

    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:hover::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid ${({ theme }) => theme.colors.text};
    z-index: 1001;
    pointer-events: none;
  }
`;

// Locale map for date-fns
const localeMap: Record<string, Locale> = {
  de: de,
  en: enUS,
  'en-US': enUS,
  es: es,
  fr: fr,
  hi: hi,
  'hi-IN': hi,
  it: it,
  ja: ja,
  ko: ko,
  nl: nl,
  'nl-NL': nl,
  pl: pl,
  pt: pt,
  'pt-BR': pt,
  'pt-PT': pt,
  ru: ru,
  tr: tr,
  zh: zhCN,
  'zh-CN': zhCN,
};

// Interfaces
export interface DateDisplayProps {
  /** Date to display (Date object, timestamp, or ISO string) */
  date: Date | string | number;

  /** Display mode */
  mode?: 'absolute' | 'relative' | 'calendar';

  /** Format string for absolute mode (date-fns format) */
  format?: string;

  /** Show tooltip with full timestamp */
  showTooltip?: boolean;

  /** Tooltip format */
  tooltipFormat?: string;

  /** Size variant */
  size?: 'small' | 'medium' | 'large';

  /** Custom className */
  className?: string;

  /** Custom style */
  style?: React.CSSProperties;

  /** Update interval for relative times (ms, default: 60000 = 1 minute) */
  updateInterval?: number;

  /** Locale override (uses i18n if not provided) */
  locale?: string;
}

/**
 * DateDisplay Component
 *
 * Formats dates with locale support and multiple display modes
 */
export const DateDisplay: React.FC<DateDisplayProps> = ({
  date,
  mode = 'absolute',
  format: formatStr = 'PPpp',
  showTooltip = false,
  tooltipFormat = 'PPPppp',
  size = 'medium',
  className,
  style,
  updateInterval = 60000,
  locale: localeOverride,
}) => {
  const { i18n } = useTranslation();
  const [, setUpdateTrigger] = React.useState(0);

  // Parse date
  const dateObj = useMemo(() => {
    if (date instanceof Date) {
      return date;
    }
    if (typeof date === 'string') {
      // Try ISO string first
      const parsed = parseISO(date);
      if (isValid(parsed)) return parsed;
      // Fall back to Date constructor
      return new Date(date);
    }
    if (typeof date === 'number') {
      return new Date(date);
    }
    return new Date();
  }, [date]);

  // Get locale
  const dateLocale = useMemo(() => {
    const localeCode = localeOverride || i18n.language || 'en-US';
    return localeMap[localeCode] || localeMap['en-US'];
  }, [localeOverride, i18n.language]);

  // Auto-update for relative times
  React.useEffect(() => {
    if (mode === 'relative' && updateInterval > 0) {
      const interval = setInterval(() => {
        setUpdateTrigger((prev) => prev + 1);
      }, updateInterval);

      return () => clearInterval(interval);
    }
  }, [mode, updateInterval]);

  // Format date based on mode
  const formattedDate = useMemo(() => {
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }

    try {
      switch (mode) {
        case 'relative':
          return formatDistance(dateObj, new Date(), {
            addSuffix: true,
            ...(dateLocale && { locale: dateLocale }),
          });

        case 'calendar':
          return formatRelative(dateObj, new Date(), {
            ...(dateLocale && { locale: dateLocale }),
          });
        default:
          return format(dateObj, formatStr, {
            ...(dateLocale && { locale: dateLocale }),
          });
      }
    } catch (error) {
      logger.error('Error formatting date:', error);
      return dateObj.toLocaleString();
    }
  }, [dateObj, mode, formatStr, dateLocale]);

  // Tooltip content
  const tooltipContent = useMemo(() => {
    if (!showTooltip || !isValid(dateObj)) return;

    try {
      return format(dateObj, tooltipFormat, {
        ...(dateLocale && { locale: dateLocale }),
      });
    } catch {
      return dateObj.toLocaleString();
    }
  }, [showTooltip, dateObj, tooltipFormat, dateLocale]);

  if (showTooltip && tooltipContent) {
    return (
      <DateWithTooltip data-tooltip={tooltipContent} className={className} style={style}>
        <DateText size={size}>{formattedDate}</DateText>
      </DateWithTooltip>
    );
  }

  return (
    <DateText size={size} className={className} style={style}>
      {formattedDate}
    </DateText>
  );
};

// Convenience exports for common use cases
export const RelativeDate: React.FC<Omit<DateDisplayProps, 'mode'>> = (props) => (
  <DateDisplay {...props} mode="relative" />
);

export const CalendarDate: React.FC<Omit<DateDisplayProps, 'mode'>> = (props) => (
  <DateDisplay {...props} mode="calendar" />
);

export const ShortDate: React.FC<Omit<DateDisplayProps, 'format'>> = (props) => (
  <DateDisplay {...props} format="PP" />
);

export const LongDate: React.FC<Omit<DateDisplayProps, 'format'>> = (props) => (
  <DateDisplay {...props} format="PPPppp" />
);

export const TimeOnly: React.FC<Omit<DateDisplayProps, 'format'>> = (props) => (
  <DateDisplay {...props} format="p" />
);

export const DateWithTime: React.FC<Omit<DateDisplayProps, 'format'>> = (props) => (
  <DateDisplay {...props} format="PPpp" />
);
