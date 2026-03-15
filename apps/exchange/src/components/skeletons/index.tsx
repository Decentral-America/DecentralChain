/**
 * Loading Skeleton Components
 * Provides animated skeleton screens for better perceived performance during loading
 */
import styled, { css, keyframes } from 'styled-components';

/**
 * Shimmer animation for skeleton loading effect
 */
const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

/**
 * Pulse animation for alternative loading effect
 */
const pulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
`;

/**
 * Base skeleton element with shimmer animation
 */
export const Skeleton = styled.div<{
  width?: string;
  height?: string;
  variant?: 'shimmer' | 'pulse';
  borderRadius?: string;
}>`
  ${(props) => {
    // Use theme colors with fallbacks
    const baseColor = props.theme.colors.border || '#e0e0e0';
    const highlightColor = props.theme.colors.hover || '#f5f5f5';

    return css`
      background: ${
        props.variant === 'pulse'
          ? baseColor
          : `linear-gradient(
            90deg,
            ${baseColor} 0%,
            ${highlightColor} 50%,
            ${baseColor} 100%
          )`
      };
      background-size: 1000px 100%;
      animation: ${props.variant === 'pulse' ? pulse : shimmer} 2s infinite linear;
      border-radius: ${props.borderRadius || '4px'};
      width: ${props.width || '100%'};
      height: ${props.height || '20px'};
    `;
  }}
`;

/**
 * Circle skeleton (for avatars, icons)
 */
export const SkeletonCircle = styled(Skeleton)`
  border-radius: 50%;
`;

/**
 * Text line skeleton
 */
export const SkeletonText = styled(Skeleton)<{
  lines?: number;
  spacing?: string;
}>`
  height: 16px;
  margin-bottom: ${(props) => props.spacing || '8px'};

  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Container for multiple skeleton elements
 */
export const SkeletonContainer = styled.div<{ spacing?: string }>`
  display: flex;
  flex-direction: column;
  gap: ${(props) => props.spacing || '16px'};
`;

/**
 * Card skeleton component
 */
export const CardSkeleton = () => (
  <SkeletonContainer>
    <Skeleton height="120px" />
    <SkeletonText width="60%" />
    <SkeletonText width="80%" />
    <SkeletonText width="40%" />
  </SkeletonContainer>
);

/**
 * Transaction list item skeleton
 */
export const TransactionSkeleton = () => (
  <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
    <SkeletonCircle width="40px" height="40px" />
    <div style={{ flex: 1 }}>
      <SkeletonText width="70%" />
      <SkeletonText width="40%" height="12px" />
    </div>
    <SkeletonText width="80px" />
  </div>
);

/**
 * Asset card skeleton
 */
export const AssetSkeleton = () => (
  <SkeletonContainer spacing="12px">
    <div style={{ alignItems: 'center', display: 'flex', gap: '12px' }}>
      <SkeletonCircle width="48px" height="48px" />
      <div style={{ flex: 1 }}>
        <SkeletonText width="50%" />
        <SkeletonText width="30%" height="12px" />
      </div>
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div style={{ flex: 1 }}>
        <SkeletonText width="40%" height="12px" />
        <SkeletonText width="60%" />
      </div>
      <div style={{ flex: 1 }}>
        <SkeletonText width="40%" height="12px" />
        <SkeletonText width="60%" />
      </div>
    </div>
  </SkeletonContainer>
);

/**
 * Table row skeleton
 */
export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => (
  <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
    {Array.from({ length: columns }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
      <SkeletonText key={i} width="100%" />
    ))}
  </div>
);

/**
 * Table skeleton with header and rows
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <SkeletonContainer>
    {/* Header */}
    <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
      {Array.from({ length: columns }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
        <SkeletonText key={i} width="100%" height="14px" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
      <TableRowSkeleton key={i} columns={columns} />
    ))}
  </SkeletonContainer>
);

/**
 * Chart skeleton
 */
export const ChartSkeleton = () => (
  <SkeletonContainer>
    <SkeletonText width="30%" />
    <Skeleton height="200px" />
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      <SkeletonText width="80px" height="12px" />
      <SkeletonText width="80px" height="12px" />
      <SkeletonText width="80px" height="12px" />
    </div>
  </SkeletonContainer>
);

/**
 * Form skeleton
 */
export const FormSkeleton = ({ fields = 3 }: { fields?: number }) => (
  <SkeletonContainer>
    {Array.from({ length: fields }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
      <div key={i}>
        <SkeletonText width="30%" height="14px" spacing="4px" />
        <Skeleton height="40px" />
      </div>
    ))}
    <Skeleton height="44px" width="120px" />
  </SkeletonContainer>
);

/**
 * Profile header skeleton (simple version)
 */
export const ProfileHeaderSkeleton = () => (
  <SkeletonContainer>
    <div style={{ alignItems: 'center', display: 'flex', gap: '16px' }}>
      <SkeletonCircle width="80px" height="80px" />
      <div style={{ flex: 1 }}>
        <SkeletonText width="40%" height="20px" />
        <SkeletonText width="60%" height="14px" />
        <SkeletonText width="30%" height="12px" />
      </div>
    </div>
  </SkeletonContainer>
);

/**
 * Grid skeleton (for asset grid, card grid, etc.)
 */
export const GridSkeleton = ({ items = 6, columns = 3 }: { items?: number; columns?: number }) => (
  <div
    style={{
      display: 'grid',
      gap: '16px',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
    }}
  >
    {Array.from({ length: items }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
      <CardSkeleton key={i} />
    ))}
  </div>
);

/**
 * List skeleton (for transaction list, asset list, etc.)
 */
export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <SkeletonContainer>
    {Array.from({ length: items }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
      <TransactionSkeleton key={i} />
    ))}
  </SkeletonContainer>
);
