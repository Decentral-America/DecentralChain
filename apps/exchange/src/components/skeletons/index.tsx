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

/** Flex row for skeleton items */
const SkeletonRow = styled.div<{ gap?: string }>`
  display: flex;
  align-items: center;
  gap: ${(props) => props.gap || '12px'};
`;

/** Flex-1 fill for skeleton items */
const SkeletonFill = styled.div`
  flex: 1;
`;

/** Side-by-side spread row */
const SkeletonSpread = styled.div`
  display: flex;
  justify-content: space-between;
`;

/** Centered flex row */
const SkeletonCenter = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

/** Table header row */
const SkeletonHeaderRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
`;

/** Dynamic CSS grid for grid skeletons */
const SkeletonGrid = styled.div<{ columns: number }>`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(${(props) => props.columns}, 1fr);
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
  <SkeletonRow>
    <SkeletonCircle width="40px" height="40px" />
    <SkeletonFill>
      <SkeletonText width="70%" />
      <SkeletonText width="40%" height="12px" />
    </SkeletonFill>
    <SkeletonText width="80px" />
  </SkeletonRow>
);

/**
 * Asset card skeleton
 */
export const AssetSkeleton = () => (
  <SkeletonContainer spacing="12px">
    <SkeletonRow gap="12px">
      <SkeletonCircle width="48px" height="48px" />
      <SkeletonFill>
        <SkeletonText width="50%" />
        <SkeletonText width="30%" height="12px" />
      </SkeletonFill>
    </SkeletonRow>
    <SkeletonSpread>
      <SkeletonFill>
        <SkeletonText width="40%" height="12px" />
        <SkeletonText width="60%" />
      </SkeletonFill>
      <SkeletonFill>
        <SkeletonText width="40%" height="12px" />
        <SkeletonText width="60%" />
      </SkeletonFill>
    </SkeletonSpread>
  </SkeletonContainer>
);

/**
 * Table row skeleton
 */
export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => (
  <SkeletonRow gap="16px">
    {Array.from({ length: columns }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
      <SkeletonText key={i} width="100%" />
    ))}
  </SkeletonRow>
);

/**
 * Table skeleton with header and rows
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
  <SkeletonContainer>
    {/* Header */}
    <SkeletonHeaderRow>
      {Array.from({ length: columns }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
        <SkeletonText key={i} width="100%" height="14px" />
      ))}
    </SkeletonHeaderRow>
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
    <SkeletonCenter>
      <SkeletonText width="80px" height="12px" />
      <SkeletonText width="80px" height="12px" />
      <SkeletonText width="80px" height="12px" />
    </SkeletonCenter>
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
    <SkeletonRow gap="16px">
      <SkeletonCircle width="80px" height="80px" />
      <SkeletonFill>
        <SkeletonText width="40%" height="20px" />
        <SkeletonText width="60%" height="14px" />
        <SkeletonText width="30%" height="12px" />
      </SkeletonFill>
    </SkeletonRow>
  </SkeletonContainer>
);

/**
 * Grid skeleton (for asset grid, card grid, etc.)
 */
export const GridSkeleton = ({ items = 6, columns = 3 }: { items?: number; columns?: number }) => (
  <SkeletonGrid columns={columns}>
    {Array.from({ length: items }, (_, i) => (
      // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholder
      <CardSkeleton key={i} />
    ))}
  </SkeletonGrid>
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
