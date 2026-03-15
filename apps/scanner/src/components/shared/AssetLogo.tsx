import { useQuery } from '@tanstack/react-query';
import { Coins } from 'lucide-react';
import { AssetLogoRequest } from '@/api/entities';
import { type AssetLogoRequestRecord, type EntityRecord } from '@/types';

interface AssetLogoProps {
  assetId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const CR_COIN_ASSET_ID = 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo';
const CR_COIN_LOGO = '/assets/crc-logo.png';

const DCC_TOKEN_ASSET_ID = 'DCC'; // Native token identifier
const DCC_TOKEN_LOGO = '/assets/dcc-logo.png';

export default function AssetLogo({
  assetId,
  size = 'md',
  className = '',
}: AssetLogoProps): React.ReactElement {
  const sizeClasses = {
    lg: 'w-16 h-16',
    md: 'w-12 h-12',
    sm: 'w-8 h-8',
    xl: 'w-24 h-24',
    xs: 'w-6 h-6',
  };

  const iconSizes = {
    lg: 'w-8 h-8',
    md: 'w-6 h-6',
    sm: 'w-4 h-4',
    xl: 'w-12 h-12',
    xs: 'w-3 h-3',
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const iconSize = iconSizes[size] || iconSizes.md;

  // Fetch approved logo for this asset
  const { data: logoRequests } = useQuery<AssetLogoRequestRecord[]>({
    enabled: !!assetId && assetId !== CR_COIN_ASSET_ID && assetId !== DCC_TOKEN_ASSET_ID,
    queryFn: async () => {
      const requests = (await AssetLogoRequest.filter({
        asset_id: assetId,
        status: 'approved',
      })) as EntityRecord[];
      return requests as AssetLogoRequestRecord[];
    },
    queryKey: ['assetLogo', assetId],
  });

  // Check if this is DCC token (hardcoded)
  if (assetId === DCC_TOKEN_ASSET_ID || assetId === 'DCC' || assetId === 'WAVES') {
    return (
      <img
        src={DCC_TOKEN_LOGO}
        alt="DCC Token"
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const sibling = target.nextElementSibling as HTMLElement | null;
          if (sibling) sibling.style.display = 'flex';
        }}
      />
    );
  }

  // Check if this is CR Coin (hardcoded)
  if (assetId === CR_COIN_ASSET_ID) {
    return (
      <img
        src={CR_COIN_LOGO}
        alt="CR Coin"
        className={`${sizeClass} rounded-full object-cover ${className}`}
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const sibling = target.nextElementSibling as HTMLElement | null;
          if (sibling) sibling.style.display = 'flex';
        }}
      />
    );
  }

  // Check if there's an approved custom logo
  const approvedLogo = logoRequests?.[0];
  if (approvedLogo?.logo_url) {
    return (
      <>
        <img
          src={typeof approvedLogo.logo_url === 'string' ? approvedLogo.logo_url : ''}
          alt={typeof approvedLogo.asset_name === 'string' ? approvedLogo.asset_name : 'Asset'}
          className={`${sizeClass} rounded-full object-cover ${className}`}
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
            const sibling = target.nextElementSibling as HTMLElement | null;
            if (sibling) sibling.style.display = 'flex';
          }}
        />
        <div
          className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-100 to-purple-100 items-center justify-center ${className} hidden`}
        >
          <Coins className={`${iconSize} text-blue-600`} />
        </div>
      </>
    );
  }

  // Placeholder for assets without logos
  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center ${className}`}
    >
      <Coins className={`${iconSize} text-blue-600`} />
    </div>
  );
}
