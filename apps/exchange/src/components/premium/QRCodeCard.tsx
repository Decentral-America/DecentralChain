/**
 * Address QR on a white plate that stays white in dark mode, so it scans from
 * any screen. The plate has 16px corners and a soft lift in light mode and a
 * hairline in dark.
 *
 * After 21st.dev "QR Code" by @tom_ui (demo 12249). That component draws dot
 * modules and rounded finder patterns from the `qrcode` package, which this
 * app does not ship; this port keeps its plate, radii and error-correction
 * choice and renders the modules with the existing qrcode.react, so no new
 * dependency is needed.
 */
import { QRCodeSVG as QRCodeSVGBase } from 'qrcode.react';
import type React from 'react';
import styled from 'styled-components';
import { palette } from '@/styles/tokens';

// React 19 type compatibility cast
const QRCodeSVG = QRCodeSVGBase as unknown as React.ComponentType<Record<string, unknown>>;

const Plate = styled.div`
  display: inline-grid;
  place-items: center;
  padding: 16px;
  border-radius: 20px;
  background: ${palette.pureWhite};
  box-shadow: ${({ theme }) =>
    theme.mode === 'dark' ? `0 0 0 1px ${theme.colors.borderStrong}` : 'var(--shadow-md)'};

  svg {
    display: block;
  }
`;

export interface QRCodeCardProps {
  value: string;
  size?: number | undefined;
  level?: 'L' | 'M' | 'Q' | 'H' | undefined;
  label?: string | undefined;
}

export function QRCodeCard({ value, size = 184, level = 'M', label }: QRCodeCardProps) {
  if (!value) return null;
  return (
    <Plate role="img" aria-label={label ?? `QR code for ${value}`}>
      <QRCodeSVG
        value={value}
        size={size}
        level={level}
        marginSize={0}
        fgColor={palette.midnightInk}
        bgColor={palette.pureWhite}
      />
    </Plate>
  );
}
