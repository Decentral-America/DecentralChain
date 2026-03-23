/**
 * AssetCard Component
 * Individual asset card showing icon, name, balance, and USD value
 */
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Card } from '@/components/atoms/Card';

const AssetCardContainer = styled(Card as React.ComponentType<Record<string, unknown>>)`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.md};
  padding: ${(p) => p.theme.spacing.md};
  cursor: pointer;
  transition: ${(p) => p.theme.transitions.medium};

  &:hover {
    background-color: ${(p) => p.theme.colors.hover};
    transform: translateX(4px);
    box-shadow: ${(p) => p.theme.shadows.md};
  }
`;

const AssetIcon = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  background-color: ${(p) => p.theme.colors.background};
`;

const AssetIconFallback = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${(p) => p.theme.colors.primary},
    ${(p) => p.theme.colors.secondary}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${(p) => p.theme.fontWeights.bold};
  font-size: ${(p) => p.theme.fontSizes.lg};
`;

const AssetInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const AssetName = styled.div`
  font-size: ${(p) => p.theme.fontSizes.md};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
  margin-bottom: 4px;
`;

const AssetBalance = styled.div`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
`;

const AssetValue = styled.div`
  font-size: ${(p) => p.theme.fontSizes.lg};
  font-weight: ${(p) => p.theme.fontWeights.bold};
  color: ${(p) => p.theme.colors.text};
  text-align: right;
`;

const AssetValueChange = styled.div<{ $positive: boolean }>`
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => (p.$positive ? p.theme.colors.success : p.theme.colors.error)};
  text-align: right;
  margin-top: 4px;
`;

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  usdValue?: number;
  change24h?: number;
  icon?: string;
  decimals?: number;
}

interface AssetCardProps {
  asset: Asset;
}

/**
 * Format balance with appropriate decimals
 */
const formatBalance = (balance: number, decimals: number = 8): string => {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(balance);
};

/**
 * Format USD value
 */
const formatUSD = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(value);
};

/**
 * Format 24h change percentage
 */
const formatChange = (change: number): string => {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
};

export const AssetCard = ({ asset }: AssetCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    void navigate(`/desktop/wallet/assets/${asset.id}`);
  };

  // Get first letter of asset name for fallback icon
  const fallbackLetter = asset.symbol.charAt(0).toUpperCase();

  return (
    <AssetCardContainer onClick={handleClick} elevation="sm">
      {asset.icon ? (
        <AssetIcon
          src={asset.icon}
          alt={asset.name}
          onError={(e) => {
            // If image fails to load, hide it
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <AssetIconFallback>{fallbackLetter}</AssetIconFallback>
      )}

      <AssetInfo>
        <AssetName>{asset.name}</AssetName>
        <AssetBalance>
          {formatBalance(asset.balance, asset.decimals)} {asset.symbol}
        </AssetBalance>
      </AssetInfo>

      <div>
        <AssetValue>{asset.usdValue != null ? formatUSD(asset.usdValue) : '—'}</AssetValue>
        {asset.change24h !== undefined && (
          <AssetValueChange $positive={asset.change24h >= 0}>
            {formatChange(asset.change24h)}
          </AssetValueChange>
        )}
      </div>
    </AssetCardContainer>
  );
};
