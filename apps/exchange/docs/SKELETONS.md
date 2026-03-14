# Loading Skeleton Components

## Overview

Loading skeleton components provide visual placeholders during data fetching and loading states. They create a better user experience by:

- **Improving perceived performance**: Users see immediate feedback instead of blank screens
- **Reducing loading anxiety**: Clear visual indication that content is loading
- **Maintaining layout stability**: Prevents layout shifts when content loads
- **Professional appearance**: Animated loading states look polished and modern

## Quick Start

```typescript
import {
  CardSkeleton,
  TransactionSkeleton,
  ListSkeleton,
  DashboardSkeleton,
} from '@/components/skeletons';

// Use in loading states
{isLoading ? <CardSkeleton /> : <Card {...data} />}
```

## Core Components

### Base Components

#### Skeleton

Basic skeleton element with shimmer animation:

```typescript
import { Skeleton } from '@/components/skeletons';

<Skeleton width="200px" height="20px" />
<Skeleton width="100%" height="40px" variant="pulse" />
```

**Props**:
- `width?`: string - Width of skeleton (default: '100%')
- `height?`: string - Height of skeleton (default: '20px')
- `variant?`: 'shimmer' | 'pulse' - Animation type (default: 'shimmer')
- `borderRadius?`: string - Border radius (default: '4px')

#### SkeletonCircle

Circular skeleton for avatars, icons:

```typescript
import { SkeletonCircle } from '@/components/skeletons';

<SkeletonCircle width="48px" height="48px" />
```

#### SkeletonText

Text line skeleton with consistent styling:

```typescript
import { SkeletonText } from '@/components/skeletons';

<SkeletonText width="60%" />
<SkeletonText width="80%" height="14px" spacing="4px" />
```

**Props**:
- `lines?`: number - Number of text lines
- `spacing?`: string - Margin bottom (default: '8px')

#### SkeletonContainer

Container for grouping skeleton elements:

```typescript
import { SkeletonContainer } from '@/components/skeletons';

<SkeletonContainer spacing="16px">
  <SkeletonText />
  <SkeletonText />
  <SkeletonText />
</SkeletonContainer>
```

## Component Skeletons

### CardSkeleton

Generic card loading skeleton:

```typescript
<CardSkeleton />
```

**Use cases**:
- Content cards
- Product cards
- Info panels

### TransactionSkeleton

Transaction list item skeleton:

```typescript
<TransactionSkeleton />
```

**Layout**:
- Circle avatar (40x40)
- Two text lines (primary + secondary)
- Right-aligned amount

**Use cases**:
- Transaction history
- Activity feed
- Notification list

### AssetSkeleton

Asset/token card skeleton:

```typescript
<AssetSkeleton />
```

**Layout**:
- Circle icon (48x48)
- Asset name + symbol
- Balance + value (two columns)

**Use cases**:
- Token list
- Portfolio assets
- Asset selection

### TableRowSkeleton

Table row with multiple columns:

```typescript
<TableRowSkeleton columns={4} />
```

**Props**:
- `columns?`: number - Number of columns (default: 4)

### TableSkeleton

Complete table with header and rows:

```typescript
<TableSkeleton rows={10} columns={5} />
```

**Props**:
- `rows?`: number - Number of rows (default: 5)
- `columns?`: number - Number of columns (default: 4)

### ChartSkeleton

Chart placeholder:

```typescript
<ChartSkeleton />
```

**Layout**:
- Title
- Chart area (200px height)
- Legend

### FormSkeleton

Form with input fields:

```typescript
<FormSkeleton fields={3} />
```

**Props**:
- `fields?`: number - Number of form fields (default: 3)

**Layout**:
- Label + input field (repeated)
- Submit button

### ProfileSkeleton

User profile header:

```typescript
<ProfileSkeleton />
```

**Layout**:
- Large avatar (80x80)
- Name, email, bio

### GridSkeleton

Grid of cards:

```typescript
<GridSkeleton items={6} columns={3} />
```

**Props**:
- `items?`: number - Number of items (default: 6)
- `columns?`: number - Columns per row (default: 3)

### ListSkeleton

Vertical list of items:

```typescript
<ListSkeleton items={5} />
```

**Props**:
- `items?`: number - Number of items (default: 5)

## Page Skeletons

Full-page skeleton screens for major views.

### DashboardSkeleton

```typescript
import { DashboardSkeleton } from '@/components/skeletons/PageSkeletons';

<DashboardSkeleton />
```

**Includes**:
- Page header
- 3 stat cards
- Chart
- Recent transactions list

### WalletSkeleton

```typescript
<WalletSkeleton />
```

**Includes**:
- Wallet card (200px height)
- Asset list (5 items)

### TransactionHistorySkeleton

```typescript
<TransactionHistorySkeleton />
```

**Includes**:
- Header with filters
- Transaction list (10 items)
- Pagination

### DexSkeleton

```typescript
<DexSkeleton />
```

**Includes**:
- Order book (left)
- Price chart (right)
- Trading form (buy/sell)
- My orders list

### SettingsSkeleton

```typescript
<SettingsSkeleton />
```

**Includes**:
- 4 settings sections
- Toggle switches
- Descriptions

### ProfileSkeleton (Page)

```typescript
<ProfileSkeleton />
```

**Includes**:
- Profile header with large avatar
- Stats (3 columns)
- Content sections

### PageSkeleton (Generic)

Flexible page skeleton with options:

```typescript
<PageSkeleton
  hasHeader={true}
  hasFilters={false}
  hasSidebar={false}
  itemCount={5}
/>
```

**Props**:
- `hasHeader?`: boolean - Include page header (default: true)
- `hasFilters?`: boolean - Include filter bar (default: false)
- `hasSidebar?`: boolean - Include sidebar (default: false)
- `itemCount?`: number - Number of content items (default: 5)

## Usage Patterns

### With Data Fetching

```typescript
import { useState, useEffect } from 'react';
import { CardSkeleton } from '@/components/skeletons';

function MyComponent() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData().then((result) => {
      setData(result);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return <CardSkeleton />;
  }

  return <Card {...data} />;
}
```

### With React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { ListSkeleton } from '@/components/skeletons';

function TransactionList() {
  const { data, isLoading } = useQuery('transactions', fetchTransactions);

  if (isLoading) {
    return <ListSkeleton items={10} />;
  }

  return (
    <div>
      {data.map((tx) => (
        <TransactionItem key={tx.id} {...tx} />
      ))}
    </div>
  );
}
```

### With Suspense

```typescript
import { Suspense } from 'react';
import { DashboardSkeleton } from '@/components/skeletons/PageSkeletons';

function App() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
```

### Route-Level Skeletons

```typescript
import { lazy, Suspense } from 'react';
import { WalletSkeleton } from '@/components/skeletons/PageSkeletons';

const WalletPage = lazy(() => import('./pages/WalletPage'));

function Routes() {
  return (
    <Suspense fallback={<WalletSkeleton />}>
      <WalletPage />
    </Suspense>
  );
}
```

## Animation Variants

### Shimmer (Default)

Gradient moves from left to right:

```typescript
<Skeleton variant="shimmer" />
```

**Best for**:
- Cards
- Lists
- General content

### Pulse

Opacity fades in and out:

```typescript
<Skeleton variant="pulse" />
```

**Best for**:
- Forms
- Inputs
- Interactive elements

## Customization

### Custom Skeleton

Create custom skeleton layouts:

```typescript
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/skeletons';

export const CustomProductSkeleton = () => (
  <div style={{ display: 'flex', gap: '16px' }}>
    <Skeleton width="120px" height="120px" />
    <div style={{ flex: 1 }}>
      <SkeletonText width="70%" />
      <SkeletonText width="50%" />
      <SkeletonText width="40%" />
      <Skeleton width="100px" height="32px" />
    </div>
  </div>
);
```

### Themed Skeleton

Skeletons automatically use theme colors:

```typescript
// Theme configuration
const theme = {
  colors: {
    gray100: '#f5f5f5', // Highlight color
    gray200: '#e0e0e0', // Base color
  },
};

// Skeleton uses these colors automatically
<Skeleton />
```

### Custom Animation

Override animation speed:

```typescript
import styled from 'styled-components';
import { Skeleton } from '@/components/skeletons';

const FastSkeleton = styled(Skeleton)`
  animation-duration: 1s; /* Faster animation */
`;

const SlowSkeleton = styled(Skeleton)`
  animation-duration: 3s; /* Slower animation */
`;
```

## Performance

### Bundle Size

All skeleton components use the same base animations, so bundle impact is minimal:

- Base components: ~2 KB
- All skeletons: ~8 KB
- Page skeletons: ~5 KB

### Rendering

Skeleton components are lightweight and fast to render:

- No external dependencies
- Pure CSS animations (GPU-accelerated)
- Minimal DOM nodes

## Accessibility

### Screen Readers

Add ARIA labels for screen readers:

```typescript
<div role="status" aria-label="Loading...">
  <CardSkeleton />
</div>
```

### Reduced Motion

Respect user's reduced motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

## Best Practices

### 1. Match Content Layout

Skeleton should match the actual content layout:

```typescript
// ✅ Good: Skeleton matches content
{isLoading ? <TransactionSkeleton /> : <TransactionItem {...data} />}

// ❌ Bad: Generic skeleton for specific content
{isLoading ? <CardSkeleton /> : <TransactionItem {...data} />}
```

### 2. Use Appropriate Counts

Match the expected number of items:

```typescript
// ✅ Good: Show expected number of transactions
<ListSkeleton items={10} />

// ❌ Bad: Too few items look incomplete
<ListSkeleton items={2} />
```

### 3. Progressive Enhancement

Show skeleton immediately, don't wait:

```typescript
// ✅ Good: Immediate feedback
const [isLoading, setIsLoading] = useState(true);

// ❌ Bad: Delay before skeleton
const [isLoading, setIsLoading] = useState(false);
setTimeout(() => setIsLoading(true), 500);
```

### 4. Consistent Sizing

Keep skeleton sizes consistent with content:

```typescript
// ✅ Good: Same height as actual card
<Skeleton height="120px" />

// ❌ Bad: Different height causes layout shift
<Skeleton height="80px" />
```

### 5. Avoid Over-Skeletonization

Use skeletons for slow-loading content, not instant updates:

```typescript
// ✅ Good: API calls, lazy-loaded components
{isLoadingFromAPI && <ListSkeleton />}

// ❌ Bad: Instant state changes
{isFilteringLocalData && <ListSkeleton />}
```

## Troubleshooting

### Skeleton Not Animating

**Check**:
1. Theme colors are defined (`gray100`, `gray200`)
2. CSS animations are enabled
3. Browser supports animations

**Fix**:
```typescript
// Add fallback colors
const Skeleton = styled.div`
  background: ${(props) => props.theme.colors.gray200 || '#e0e0e0'};
`;
```

### Layout Shifts After Loading

**Check**:
1. Skeleton height matches content height
2. Container width is constrained

**Fix**:
```typescript
// Set explicit heights
<Skeleton height="120px" /> // Matches <Card height="120px" />
```

### Too Many Skeletons

**Optimize**:
```typescript
// Use GridSkeleton instead of multiple CardSkeletons
<GridSkeleton items={9} columns={3} />

// Instead of
{Array.from({ length: 9 }).map((_, i) => <CardSkeleton key={i} />)}
```

## Examples

See Storybook for interactive examples:

```bash
npm run storybook
```

Navigate to "Loading/Skeletons" section.

## Resources

- [Skeleton Screens Guide](https://www.lukew.com/ff/entry.asp?1797)
- [Loading Best Practices](https://web.dev/loading-best-practices/)
- [Perceived Performance](https://www.smashingmagazine.com/2015/09/perceived-performance/)
