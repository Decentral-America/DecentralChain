import type React from 'react';
import { useCallback, useState } from 'react';
import styled from 'styled-components';
import { NetworkConfig as networkConfig } from '@/config/networkConfig';

// Styled Components
const LogoContainer = styled.div<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const LogoImg = styled.img<{ $size: number }>`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const Fallback = styled.div<{ $size: number; $color?: string | undefined }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme, $color }) => $color || `${theme.colors.primary}20`};
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 600;
  font-size: ${({ $size }) => Math.max($size * 0.4, 12)}px;
  text-transform: uppercase;
  user-select: none;
`;

// Interfaces
export interface AssetLogoProps {
  /** Asset ID or symbol */
  assetId: string;
  /** Size in pixels (width and height) */
  size?: number;
  /** Custom logo URL (overrides default asset platform URL) */
  customUrl?: string;
  /** Fallback text (defaults to first 2 characters of assetId) */
  fallbackText?: string;
  /** Custom fallback background color */
  fallbackColor?: string;
  /** Class name for styling */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  /** Callback when image loads successfully */
  onLoad?: () => void;
  /** Callback when image fails to load */
  onError?: () => void;
}

export const AssetLogo: React.FC<AssetLogoProps> = ({
  assetId,
  size = 32,
  customUrl,
  fallbackText,
  fallbackColor,
  className,
  style,
  onLoad,
  onError,
}) => {
  const [error, setError] = useState(false);

  // Generate logo URL — DCC native asset logo derived from the configured origin
  const logoUrl =
    customUrl ||
    (assetId === 'DCC'
      ? `${networkConfig.origin}/img/logo-dcc.svg`
      : `https://assets-cdn.trustwallet.com/blockchains/dcc/assets/${assetId}.png`);

  // Generate fallback text
  const fallback = fallbackText || (assetId ? assetId.slice(0, 2).toUpperCase() : '??');

  // Handle image load
  const handleLoad = useCallback(() => {
    setError(false);
    onLoad?.();
  }, [onLoad]);

  // Handle image error
  const handleError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);

  return (
    <LogoContainer $size={size} className={className} style={style}>
      {error ? (
        <Fallback $size={size} $color={fallbackColor}>
          {fallback}
        </Fallback>
      ) : (
        <LogoImg
          $size={size}
          src={logoUrl}
          alt={`${assetId} logo`}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </LogoContainer>
  );
};

// Convenience exports for common sizes
export const AssetLogoSmall: React.FC<Omit<AssetLogoProps, 'size'>> = (props) => (
  <AssetLogo {...props} size={24} />
);

export const AssetLogoMedium: React.FC<Omit<AssetLogoProps, 'size'>> = (props) => (
  <AssetLogo {...props} size={32} />
);

export const AssetLogoLarge: React.FC<Omit<AssetLogoProps, 'size'>> = (props) => (
  <AssetLogo {...props} size={48} />
);

export const AssetLogoXLarge: React.FC<Omit<AssetLogoProps, 'size'>> = (props) => (
  <AssetLogo {...props} size={64} />
);
