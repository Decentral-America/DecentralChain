# Empty State Components

Comprehensive guide to using empty state components in DCC Wallet.

## Table of Contents

- [Overview](#overview)
- [Base Component](#base-component)
- [Pre-built Empty States](#pre-built-empty-states)
- [Customization](#customization)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Accessibility](#accessibility)

## Overview

Empty states are critical UI elements that appear when there's no data to display. They:

- **Explain** why the screen is empty
- **Guide** users toward their next action
- **Maintain** user engagement during empty data scenarios
- **Improve** perceived quality and professionalism

### When to Use Empty States

- **No Data Yet**: User hasn't created any content (transactions, orders, etc.)
- **Empty Results**: Search/filter returned no matches
- **Error States**: Network errors, permission issues, etc.
- **Coming Soon**: Features under development
- **404/403**: Page not found or unauthorized access

## Base Component

### EmptyState

Generic empty state component with full customization options.

```tsx
import { EmptyState } from './components/EmptyState';

<EmptyState
  icon={<WalletIcon />}
  title="No Transactions Yet"
  message="You haven't made any transactions yet. Start by sending or receiving DCC."
  action={{
    label: 'Send DCC',
    onClick: handleSendClick,
    variant: 'primary'
  }}
  secondaryAction={{
    label: 'Learn More',
    onClick: handleLearnClick,
    variant: 'text'
  }}
  helpText="Need help? Check out our documentation"
  variant="default"
  size="medium"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `React.ReactNode` | `undefined` | Icon or illustration to display |
| `title` | `string` | **required** | Main title text |
| `message` | `string` | **required** | Descriptive message |
| `action` | `EmptyStateAction` | `undefined` | Primary action button |
| `secondaryAction` | `EmptyStateAction` | `undefined` | Secondary action button |
| `helpText` | `string` | `undefined` | Additional help text below actions |
| `variant` | `'default' \| 'compact' \| 'fullscreen'` | `'default'` | Visual variant |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of icon and text |

### EmptyStateAction Type

```typescript
interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'text';
  icon?: React.ReactNode;
}
```

## Pre-built Empty States

### 1. EmptyTransactions

**Use Case**: Wallet transaction history with no transactions

```tsx
import { EmptyTransactions } from './components/EmptyState';

<EmptyTransactions
  onCreateTransaction={() => navigate('/send')}
/>
```

**Features**:
- Default icon: 📝
- Title: "No Transactions Yet"
- Helpful message about getting started
- Optional "Send DCC" action button

---

### 2. EmptyAssets

**Use Case**: Asset list with no assets

```tsx
import { EmptyAssets } from './components/EmptyState';

<EmptyAssets
  onAddAsset={() => navigate('/assets/add')}
/>
```

**Features**:
- Default icon: 💎
- Title: "No Assets"
- Explanation that assets appear automatically
- Optional "Add Asset" action button
- Help text about automatic asset addition

---

### 3. EmptyOrders

**Use Case**: DEX with no open orders

```tsx
import { EmptyOrders } from './components/EmptyState';

<EmptyOrders
  onCreateOrder={() => navigate('/dex/create-order')}
/>
```

**Features**:
- Default icon: 📊
- Title: "No Open Orders"
- Encouragement to create first order
- Optional "Create Order" action button

---

### 4. EmptySearch

**Use Case**: Search results with no matches

```tsx
import { EmptySearch } from './components/EmptyState';

<EmptySearch
  searchQuery={searchTerm}
  onClearSearch={() => setSearchTerm('')}
/>
```

**Features**:
- Default icon: 🔍
- Title: "No Results Found"
- Shows search query in message
- Compact variant for inline display
- Optional "Clear Search" button

---

### 5. EmptyFilter

**Use Case**: Filtered list with no matching items

```tsx
import { EmptyFilter } from './components/EmptyState';

<EmptyFilter
  onClearFilters={() => resetFilters()}
/>
```

**Features**:
- Default icon: 🔎
- Title: "No Matching Items"
- Suggests clearing filters
- Compact variant
- Optional "Clear Filters" button

---

### 6. EmptyWallet

**Use Case**: No wallet created or imported yet

```tsx
import { EmptyWallet } from './components/EmptyState';

<EmptyWallet
  onCreateWallet={() => navigate('/wallet/create')}
  onImportWallet={() => navigate('/wallet/import')}
/>
```

**Features**:
- Default icon: 👛
- Title: "No Wallet"
- Fullscreen variant
- Large size
- Two action buttons (Create/Import)

---

### 7. NetworkError

**Use Case**: Network connection errors

```tsx
import { NetworkError } from './components/EmptyState';

<NetworkError
  onRetry={() => refetch()}
/>
```

**Features**:
- Default icon: 🌐
- Title: "Connection Error"
- Clear error explanation
- Optional "Retry" button
- Help text about internet connection

---

### 8. ErrorState

**Use Case**: Generic error handling

```tsx
import { ErrorState } from './components/EmptyState';

<ErrorState
  error={error}
  onRetry={() => refetch()}
/>
```

**Features**:
- Default icon: ⚠️
- Title: "Something Went Wrong"
- Accepts Error object or string
- Shows error message
- Optional "Try Again" button

---

### 9. ComingSoon

**Use Case**: Features under development

```tsx
import { ComingSoon } from './components/EmptyState';

<ComingSoon
  feature="Staking"
/>
```

**Features**:
- Default icon: 🚀
- Title: "Coming Soon"
- Shows feature name in message
- Fullscreen variant
- Large size

---

### 10. Maintenance

**Use Case**: System maintenance mode

```tsx
import { Maintenance } from './components/EmptyState';

<Maintenance
  estimatedTime="in 2 hours"
/>
```

**Features**:
- Default icon: 🔧
- Title: "Under Maintenance"
- Optional estimated time
- Fullscreen variant
- Thank you message

---

### 11. NotFound

**Use Case**: 404 Page Not Found

```tsx
import { NotFound } from './components/EmptyState';

<NotFound
  onGoHome={() => navigate('/')}
/>
```

**Features**:
- Default icon: ❓
- Title: "Page Not Found"
- Fullscreen variant
- Optional "Go Home" button

---

### 12. Unauthorized

**Use Case**: 403 Access Denied

```tsx
import { Unauthorized } from './components/EmptyState';

<Unauthorized
  onLogin={() => navigate('/login')}
/>
```

**Features**:
- Default icon: 🔒
- Title: "Access Denied"
- Clear permission message
- Optional "Sign In" button
- Fullscreen variant

## Customization

### Custom Icons

Replace emoji icons with custom SVG components:

```tsx
import { WalletIcon } from './icons';

<EmptyState
  icon={<WalletIcon width={64} height={64} />}
  title="No Wallet"
  message="Create a wallet to get started"
/>
```

### Custom Styling

Wrap in a styled container for custom styling:

```tsx
import styled from 'styled-components';

const CustomWrapper = styled.div`
  background: ${(props) => props.theme.colors.background};
  border-radius: 8px;
  padding: 2rem;
`;

<CustomWrapper>
  <EmptyState
    title="Custom Styled Empty State"
    message="This has custom styling"
  />
</CustomWrapper>
```

### Variants

#### Default
Standard empty state with moderate padding:

```tsx
<EmptyState
  variant="default"
  title="Default Variant"
  message="Standard padding and spacing"
/>
```

#### Compact
Reduced padding for inline or card usage:

```tsx
<EmptyState
  variant="compact"
  title="Compact Variant"
  message="Less padding for tight spaces"
/>
```

#### Fullscreen
Maximum padding for full-page empty states:

```tsx
<EmptyState
  variant="fullscreen"
  title="Fullscreen Variant"
  message="Takes up full screen with lots of padding"
/>
```

### Sizes

#### Small
Smaller icons and text:

```tsx
<EmptyState
  size="small"
  title="Small Size"
  message="48px icon, smaller text"
/>
```

#### Medium (default)
Standard size:

```tsx
<EmptyState
  size="medium"
  title="Medium Size"
  message="64px icon, standard text"
/>
```

#### Large
Larger icons and text:

```tsx
<EmptyState
  size="large"
  title="Large Size"
  message="96px icon, larger text"
/>
```

## Best Practices

### 1. Be Helpful, Not Just Empty

**Good** ✅
```tsx
<EmptyState
  title="No Transactions Yet"
  message="You haven't made any transactions yet. Start by sending or receiving DCC."
  action={{ label: 'Send DCC', onClick: handleSend }}
/>
```

**Bad** ❌
```tsx
<EmptyState
  title="Empty"
  message="No data"
/>
```

### 2. Provide Clear Actions

Always provide a clear next step when possible:

```tsx
<EmptyState
  title="No Assets"
  message="Add assets to your wallet to start trading"
  action={{
    label: 'Add Asset',
    onClick: handleAddAsset,
    variant: 'primary'
  }}
/>
```

### 3. Match Variant to Context

- **Fullscreen**: First-time user experiences, major errors
- **Default**: Standard page sections
- **Compact**: Cards, inline sections, search results

```tsx
// Fullscreen for onboarding
<EmptyWallet variant="fullscreen" size="large" />

// Compact for search
<EmptySearch variant="compact" searchQuery={query} />

// Default for sections
<EmptyTransactions variant="default" />
```

### 4. Use Appropriate Icons

Choose icons that match the context:

```tsx
// Data-related
<EmptyState icon="📊" title="No Data" />

// Search-related
<EmptyState icon="🔍" title="No Results" />

// Error-related
<EmptyState icon="⚠️" title="Error" />

// Success/Empty-related
<EmptyState icon="✨" title="All Done!" />
```

### 5. Maintain Consistency

Use pre-built components for consistency:

```tsx
// Consistent across app
<EmptyTransactions />
<EmptyAssets />
<EmptyOrders />
```

### 6. Handle Loading States

Combine with skeleton loaders:

```tsx
{loading ? (
  <TransactionListSkeleton />
) : transactions.length === 0 ? (
  <EmptyTransactions />
) : (
  <TransactionList data={transactions} />
)}
```

### 7. Test Edge Cases

Consider all empty state scenarios:

- First-time users
- Filtered results
- Search results
- Network errors
- Permission errors
- Deleted data
- Expired sessions

## Examples

### Complete Transaction Page

```tsx
import { EmptyTransactions, TransactionListSkeleton } from './components';

const TransactionsPage = () => {
  const { data, loading, error } = useTransactions();
  
  if (loading) {
    return <TransactionListSkeleton />;
  }
  
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => refetch()}
      />
    );
  }
  
  if (data.length === 0) {
    return (
      <EmptyTransactions
        onCreateTransaction={() => navigate('/send')}
      />
    );
  }
  
  return <TransactionList data={data} />;
};
```

### Search with Empty Results

```tsx
import { EmptySearch } from './components';

const SearchResults = ({ query, results }) => {
  if (results.length === 0) {
    return (
      <EmptySearch
        searchQuery={query}
        onClearSearch={() => setQuery('')}
      />
    );
  }
  
  return <ResultsList results={results} />;
};
```

### Error Boundary with Empty State

```tsx
import { ErrorState } from './components';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          error={this.state.error}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

### Conditional Wallet Creation

```tsx
import { EmptyWallet } from './components';

const WalletPage = () => {
  const { wallet } = useWallet();
  
  if (!wallet) {
    return (
      <EmptyWallet
        onCreateWallet={() => navigate('/wallet/create')}
        onImportWallet={() => navigate('/wallet/import')}
      />
    );
  }
  
  return <WalletDashboard wallet={wallet} />;
};
```

## Accessibility

### Keyboard Navigation

All action buttons are keyboard accessible:

```tsx
<EmptyState
  action={{
    label: 'Create Wallet',
    onClick: handleCreate, // Supports Enter key
  }}
/>
```

### Screen Readers

Use semantic HTML and ARIA labels:

```tsx
<Container role="status" aria-live="polite">
  <Title>{title}</Title>
  <Message>{message}</Message>
  {action && (
    <Button aria-label={`${action.label} - ${message}`}>
      {action.label}
    </Button>
  )}
</Container>
```

### Focus Management

Ensure focus moves to empty state after data clears:

```tsx
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (data.length === 0) {
    containerRef.current?.focus();
  }
}, [data]);

<Container ref={containerRef} tabIndex={-1}>
  <EmptyState />
</Container>
```

### Color Contrast

All text meets WCAG AA standards:

- Title: Full opacity on theme background
- Message: 60% opacity minimum
- Help text: 40% opacity minimum

## Migration Guide

### From Old Empty States

**Before**:
```tsx
<div style={{ textAlign: 'center', padding: '2rem' }}>
  <p>No transactions</p>
  <button onClick={handleCreate}>Create</button>
</div>
```

**After**:
```tsx
<EmptyTransactions
  onCreateTransaction={handleCreate}
/>
```

### Benefits of Migration

1. **Consistency**: Same look and feel across app
2. **Maintenance**: Update all empty states in one place
3. **Accessibility**: Built-in keyboard and screen reader support
4. **Responsive**: Automatically adapts to screen size
5. **Themed**: Uses theme colors automatically

## Performance

- **Zero runtime overhead**: Pure CSS styling
- **Tree-shakable**: Only bundle used components
- **Lightweight**: ~2KB gzipped for all components
- **Fast rendering**: No complex calculations or effects

## Testing

```tsx
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

test('renders empty state with action', () => {
  const handleClick = jest.fn();
  
  render(
    <EmptyState
      title="No Data"
      message="Add some data to get started"
      action={{
        label: 'Add Data',
        onClick: handleClick
      }}
    />
  );
  
  expect(screen.getByText('No Data')).toBeInTheDocument();
  expect(screen.getByText('Add some data to get started')).toBeInTheDocument();
  
  const button = screen.getByText('Add Data');
  button.click();
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

## Support

- **Documentation**: See component props in TypeScript definitions
- **Examples**: Check `src/components/EmptyState.tsx` for all variants
- **Issues**: Report bugs via GitHub issues
- **Contributions**: Pull requests welcome!
