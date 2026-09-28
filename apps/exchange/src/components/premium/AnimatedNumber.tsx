/**
 * A number whose digits roll to their new value, like Apple's Stocks app.
 * Built on @number-flow/react (the library behind 21st.dev's "Number Flow" by
 * @barvian), which renders real text so it stays selectable and accessible.
 */
import NumberFlow, { type Format } from '@number-flow/react';
import styled from 'styled-components';

const Figure = styled.span`
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' on;
  white-space: nowrap;

  /* NumberFlow's own mask fades digits at the edges of the roll. */
  number-flow-react {
    --number-flow-mask-height: 0.2em;
  }
`;

export interface AnimatedNumberProps {
  value: number;
  /** Maximum fraction digits. Defaults to 2, or 8 for values under 1. */
  decimals?: number;
  minDecimals?: number;
  prefix?: string;
  suffix?: string;
  /** Render as a signed change, e.g. +2.4% */
  signed?: boolean;
  format?: Format;
  className?: string;
}

export function AnimatedNumber({
  value,
  decimals,
  minDecimals = 0,
  prefix,
  suffix,
  signed = false,
  format,
  className,
}: AnimatedNumberProps) {
  const safe = Number.isFinite(value) ? value : 0;
  const max = decimals ?? (Math.abs(safe) > 0 && Math.abs(safe) < 1 ? 8 : 2);
  return (
    <Figure className={className}>
      <NumberFlow
        value={safe}
        {...(prefix !== undefined ? { prefix } : {})}
        {...(suffix !== undefined ? { suffix } : {})}
        format={{
          maximumFractionDigits: max,
          minimumFractionDigits: Math.min(minDecimals, max),
          signDisplay: signed ? 'exceptZero' : 'auto',
          ...format,
        }}
        transformTiming={{ duration: 750, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
        spinTiming={{ duration: 750, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
        willChange
      />
    </Figure>
  );
}
