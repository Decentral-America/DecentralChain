/**
 * Page Loading Skeleton Components
 * Full-page skeleton screens for major application views
 */
import styled from 'styled-components';
import {
  SkeletonContainer,
  SkeletonText,
  Skeleton,
  SkeletonCircle,
  AssetSkeleton,
  TransactionSkeleton,
  ChartSkeleton,
} from './index';

const PageContainer = styled.div`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 32px;
`;

const Section = styled.div`
  margin-bottom: 24px;
`;

const Grid = styled.div<{ columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.columns || 2}, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

/**
 * Dashboard page skeleton
 */
export const DashboardSkeleton = () => (
  <PageContainer>
    {/* Header */}
    <Header>
      <SkeletonText width="300px" height="32px" spacing="12px" />
      <SkeletonText width="200px" height="16px" />
    </Header>

    {/* Stats cards */}
    <Grid columns={3}>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i}>
          <SkeletonText width="40%" height="14px" spacing="8px" />
          <SkeletonText width="60%" height="24px" />
        </div>
      ))}
    </Grid>

    {/* Chart */}
    <Section>
      <ChartSkeleton />
    </Section>

    {/* Recent transactions */}
    <Section>
      <SkeletonText width="200px" height="20px" spacing="16px" />
      <SkeletonContainer>
        {Array.from({ length: 5 }, (_, i) => (
          <TransactionSkeleton key={i} />
        ))}
      </SkeletonContainer>
    </Section>
  </PageContainer>
);

/**
 * Wallet page skeleton
 */
export const WalletSkeleton = () => (
  <PageContainer>
    {/* Wallet card */}
    <Section>
      <Skeleton height="200px" borderRadius="12px" />
    </Section>

    {/* Asset list */}
    <Section>
      <SkeletonText width="150px" height="20px" spacing="16px" />
      <SkeletonContainer>
        {Array.from({ length: 5 }, (_, i) => (
          <AssetSkeleton key={i} />
        ))}
      </SkeletonContainer>
    </Section>
  </PageContainer>
);

/**
 * Transaction history page skeleton
 */
export const TransactionHistorySkeleton = () => (
  <PageContainer>
    {/* Header with filters */}
    <Header>
      <SkeletonText width="250px" height="28px" spacing="16px" />
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <Skeleton width="120px" height="36px" />
        <Skeleton width="120px" height="36px" />
        <Skeleton width="120px" height="36px" />
      </div>
    </Header>

    {/* Transaction list */}
    <SkeletonContainer>
      {Array.from({ length: 10 }, (_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </SkeletonContainer>

    {/* Pagination */}
    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <Skeleton key={i} width="32px" height="32px" borderRadius="50%" />
      ))}
    </div>
  </PageContainer>
);

/**
 * DEX trading page skeleton
 */
export const DexSkeleton = () => (
  <PageContainer>
    <Grid columns={2}>
      {/* Left panel - Order book */}
      <div>
        <SkeletonText width="120px" height="20px" spacing="16px" />
        <SkeletonContainer>
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <SkeletonText width="30%" height="14px" />
              <SkeletonText width="30%" height="14px" />
              <SkeletonText width="30%" height="14px" />
            </div>
          ))}
        </SkeletonContainer>
      </div>

      {/* Right panel - Chart */}
      <div>
        <ChartSkeleton />
      </div>
    </Grid>

    {/* Trading form */}
    <Section>
      <SkeletonText width="100px" height="20px" spacing="16px" />
      <Grid columns={2}>
        <SkeletonContainer>
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="44px" />
        </SkeletonContainer>
        <SkeletonContainer>
          <Skeleton height="40px" />
          <Skeleton height="40px" />
          <Skeleton height="44px" />
        </SkeletonContainer>
      </Grid>
    </Section>

    {/* My orders */}
    <Section>
      <SkeletonText width="120px" height="20px" spacing="16px" />
      <SkeletonContainer>
        {Array.from({ length: 3 }, (_, i) => (
          <TransactionSkeleton key={i} />
        ))}
      </SkeletonContainer>
    </Section>
  </PageContainer>
);

/**
 * Settings page skeleton
 */
export const SettingsSkeleton = () => (
  <PageContainer>
    <Header>
      <SkeletonText width="150px" height="32px" />
    </Header>

    {Array.from({ length: 4 }, (_, sectionIndex) => (
      <Section key={sectionIndex}>
        <SkeletonText width="200px" height="20px" spacing="12px" />
        <SkeletonContainer>
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <div style={{ flex: 1 }}>
                <SkeletonText width="40%" />
                <SkeletonText width="60%" height="12px" />
              </div>
              <Skeleton width="48px" height="24px" borderRadius="12px" />
            </div>
          ))}
        </SkeletonContainer>
      </Section>
    ))}
  </PageContainer>
);

/**
 * Profile page skeleton
 */
export const ProfileSkeleton = () => (
  <PageContainer>
    {/* Profile header */}
    <Header>
      <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <SkeletonCircle width="120px" height="120px" />
        <div style={{ flex: 1 }}>
          <SkeletonText width="250px" height="28px" spacing="8px" />
          <SkeletonText width="180px" height="16px" spacing="8px" />
          <SkeletonText width="300px" height="14px" />
        </div>
      </div>
    </Header>

    {/* Stats */}
    <Grid columns={3}>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i}>
          <SkeletonText width="50%" height="14px" spacing="8px" />
          <SkeletonText width="70%" height="24px" />
        </div>
      ))}
    </Grid>

    {/* Content sections */}
    {Array.from({ length: 2 }, (_, i) => (
      <Section key={i}>
        <SkeletonText width="180px" height="20px" spacing="16px" />
        <Skeleton height="150px" />
      </Section>
    ))}
  </PageContainer>
);

/**
 * Generic page skeleton with flexible layout
 */
export const PageSkeleton = ({
  hasHeader = true,
  hasFilters = false,
  hasSidebar = false,
  itemCount = 5,
}: {
  hasHeader?: boolean;
  hasFilters?: boolean;
  hasSidebar?: boolean;
  itemCount?: number;
}) => (
  <PageContainer>
    {hasHeader && (
      <Header>
        <SkeletonText width="300px" height="32px" spacing="12px" />
        <SkeletonText width="200px" height="16px" />
      </Header>
    )}

    {hasFilters && (
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <Skeleton width="120px" height="36px" />
        <Skeleton width="120px" height="36px" />
        <Skeleton width="120px" height="36px" />
      </div>
    )}

    <Grid columns={hasSidebar ? 3 : 1}>
      {hasSidebar && (
        <div>
          <SkeletonContainer>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} height="40px" />
            ))}
          </SkeletonContainer>
        </div>
      )}

      <div style={{ gridColumn: hasSidebar ? 'span 2' : 'auto' }}>
        <SkeletonContainer>
          {Array.from({ length: itemCount }, (_, i) => (
            <Skeleton key={i} height="100px" />
          ))}
        </SkeletonContainer>
      </div>
    </Grid>
  </PageContainer>
);
