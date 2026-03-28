import { QRCodeCanvas as QRCodeCanvasBase, QRCodeSVG as QRCodeSVGBase } from 'qrcode.react';
import React from 'react';
import styled from 'styled-components';

// React 19 type compatibility casts — single source of truth; import from here rather than casting in consumers
export const QRCodeSVG = QRCodeSVGBase as unknown as React.ComponentType<Record<string, unknown>>;
export const QRCodeCanvas = QRCodeCanvasBase as unknown as React.ComponentType<
  Record<string, unknown>
>;

/**
 * QRCode Component
 *
 * Generates QR codes for:
 * - Wallet addresses
 * - Payment requests
 * - Transaction data
 * - URLs and text data
 *
 * Supports both SVG and Canvas rendering
 */

// Styled Components
const QRWrapper = styled.div<{ $size: number }>`
  display: inline-flex;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: fit-content;
`;

const QRContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const QRLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text};
  text-align: center;
  max-width: 100%;
  word-break: break-all;
`;

const DownloadButton = styled.button`
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.primary};
  background-color: transparent;
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${({ theme }) => theme.colors.primary};
    color: #ffffff;
  }

  &:active {
    transform: translateY(1px);
  }
`;

// Interfaces
export interface QRCodeProps {
  /** The value to encode in the QR code */
  value: string;

  /** Size in pixels (default: 200) */
  size?: number;

  /** Rendering mode (default: 'svg') */
  renderAs?: 'svg' | 'canvas';

  /** Background color (default: white) */
  bgColor?: string;

  /** Foreground color (default: black) */
  fgColor?: string;

  /** Error correction level */
  level?: 'L' | 'M' | 'Q' | 'H';

  /** Include margin (default: true) */
  includeMargin?: boolean;

  /** Logo/image URL to center in QR code */
  imageSettings?: {
    src: string;
    height: number;
    width: number;
    excavate: boolean;
  };

  /** Show label below QR code */
  label?: string;

  /** Show wrapper with border and padding */
  showWrapper?: boolean;

  /** Enable download button */
  enableDownload?: boolean;

  /** Download filename */
  downloadFilename?: string;

  /** Custom className */
  className?: string;

  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * QRCode Component
 *
 * Generates QR codes for addresses, payments, and data
 */
export const QRCode: React.FC<QRCodeProps> = ({
  value,
  size = 200,
  renderAs = 'svg',
  bgColor = '#ffffff',
  fgColor = '#000000',
  level = 'M',
  includeMargin = true,
  imageSettings,
  label,
  showWrapper = true,
  enableDownload = false,
  downloadFilename = 'qrcode',
  className,
  style,
}) => {
  const qrRef = React.useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;

    const canvas = qrRef.current.querySelector('canvas');
    const svg = qrRef.current.querySelector('svg');

    if (renderAs === 'canvas' && canvas) {
      // Download canvas as PNG
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${downloadFilename}.png`;
      link.href = url;
      link.click();
    } else if (renderAs === 'svg' && svg) {
      // Download SVG
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.download = `${downloadFilename}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const qrProps = {
    bgColor,
    fgColor,
    imageSettings,
    includeMargin,
    level,
    size,
    value,
  };

  const qrElement =
    renderAs === 'canvas' ? <QRCodeCanvas {...qrProps} /> : <QRCodeSVG {...qrProps} />;

  const content = (
    <QRContainer>
      <div ref={qrRef}>{qrElement}</div>
      {label && <QRLabel>{label}</QRLabel>}
      {enableDownload && <DownloadButton onClick={handleDownload}>Download QR Code</DownloadButton>}
    </QRContainer>
  );

  if (showWrapper) {
    return (
      <QRWrapper $size={size} className={className} style={style}>
        {content}
      </QRWrapper>
    );
  }

  return (
    <div className={className} style={style}>
      {content}
    </div>
  );
};

// Convenience exports
export const QRCodeSmall: React.FC<Omit<QRCodeProps, 'size'>> = (props) => (
  <QRCode {...props} size={128} />
);

export const QRCodeMedium: React.FC<Omit<QRCodeProps, 'size'>> = (props) => (
  <QRCode {...props} size={200} />
);

export const QRCodeLarge: React.FC<Omit<QRCodeProps, 'size'>> = (props) => (
  <QRCode {...props} size={300} />
);

export const QRCodeForAddress: React.FC<Omit<QRCodeProps, 'label' | 'showWrapper'>> = (props) => (
  <QRCode {...props} label={props.value} showWrapper={true} />
);
