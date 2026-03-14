# State Management Documentation

Complete guide to state management patterns in the DCC Wallet React application using Zustand, React Query, and Context API.

## Table of Contents

1. [Overview](#overview)
2. [Three-Layer Architecture](#three-layer-architecture)
3. [React Query - Server State](#react-query---server-state)
4. [Zustand - Client State](#zustand---client-state)
5. [Context API - Global State](#context-api---global-state)
6. [Custom Hooks](#custom-hooks)
7. [State Management Patterns](#state-management-patterns)
8. [Best Practices](#best-practices)
9. [Testing State](#testing-state)
10. [Migration from Angular](#migration-from-angular)

---

## Overview

The DCC Wallet uses a three-layer state management architecture to handle different types of state:

| State Type | Tool | Purpose | Examples |
|------------|------|---------|----------|
| **Server State** | React Query | Cached API data | Balances, transactions, assets |
| **Client State** | Zustand | Complex UI state | DEX trading, forms |
| **Global State** | Context API | App-wide settings | Auth, theme, config |

### Why Three Layers?

- **Separation of Concerns**: Each tool handles what it does best
- **Performance**: React Query handles caching, Zustand minimizes re-renders
- **Developer Experience**: Simple APIs, easy to understand and maintain
- **Type Safety**: Full TypeScript support across all layers

---

## Three-Layer Architecture

```
┌─────────────────────────────────────────────────────┐
│                 React Components                     │
└─────────────────────────────────────────────────────┘
           │                │               │
           ▼                ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Context │    │  Zustand │    │  React   │
    │   API    │    │  Store   │    │  Query   │
    └──────────┘    └──────────┘    └──────────┘
           │                │               │
           ▼                ▼               ▼
    Global State      Client State     Server State
    - Auth            - UI State      - API Data
    - Theme           - Forms         - Caching
    - Config          - DEX State     - Sync
```

---

## React Query - Server State

React Query manages all server-side data with automatic caching, background refetching, and optimistic updates.

### Configuration

```typescript
// lib/react-query.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,              // 30 seconds
      gcTime: 300000,                 // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    },
    mutations: {
      retry: false
    }
  }
});
```

### Usage Patterns

#### 1. Basic Query

```tsx
// hooks/useBalance.ts
import { useQuery } from '@tanstack/react-query';
import { addressApi } from '@/services/api';

export const useBalance = (address: string) => {
  return useQuery({
    queryKey: ['balance', address],
    queryFn: () => addressApi.getBalance(address),
    enabled: !!address, // Only fetch when address exists
    staleTime: 10000,   // Override default if needed
  });
};

// Component usage
function Wallet({ address }: { address: string }) {
  const { data, isLoading, error, refetch } = useBalance(address);
  
  if (isLoading) return <Spinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  
  return (
    <div>
      <h2>Balance: {data?.available} DCC</h2>
      <Button onClick={() => refetch()}>Refresh</Button>
    </div>
  );
}
```

#### 2. Query with Polling

```tsx
// hooks/useTransactions.ts
export const useTransactions = (address: string, limit: number = 50) => {
  return useQuery({
    queryKey: ['transactions', address, limit],
    queryFn: () => addressApi.getTransactions(address, limit),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!address,
  });
};
```

#### 3. Query with Dependencies

```tsx
// hooks/useAssetDetails.ts
export const useAssetDetails = (assetId: string | null) => {
  return useQuery({
    queryKey: ['asset', assetId],
    queryFn: () => assetApi.getAsset(assetId!),
    enabled: !!assetId, // Only fetch when assetId is available
    staleTime: 60000,   // Assets data changes less frequently
  });
};

// Component with dependent queries
function AssetDetails({ assetId }: { assetId: string | null }) {
  // First query
  const { data: asset } = useAssetDetails(assetId);
  
  // Second query depends on first query result
  const { data: distribution } = useQuery({
    queryKey: ['assetDistribution', asset?.assetId],
    queryFn: () => assetApi.getDistribution(asset!.assetId),
    enabled: !!asset?.assetId, // Only fetch when asset is loaded
  });
  
  return <div>{/* ... */}</div>;
}
```

#### 4. Mutations (Create/Update/Delete)

```tsx
// hooks/useTransactionBroadcast.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useTransactionBroadcast = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  
  return useMutation({
    mutationFn: (tx: Transaction) => transactionApi.broadcast(tx),
    
    // Optimistic update
    onMutate: async (newTx) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['transactions'] });
      
      // Snapshot previous value
      const previousTxs = queryClient.getQueryData(['transactions']);
      
      // Optimistically update
      queryClient.setQueryData(['transactions'], (old: Transaction[]) => [
        newTx,
        ...old
      ]);
      
      return { previousTxs };
    },
    
    // Rollback on error
    onError: (err, newTx, context) => {
      queryClient.setQueryData(['transactions'], context.previousTxs);
      toast.error('Transaction failed: ' + err.message);
    },
    
    // Refetch on success
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      toast.success('Transaction broadcast successfully');
    }
  });
};

// Component usage
function SendAssetForm() {
  const { mutate: broadcastTx, isPending } = useTransactionBroadcast();
  
  const handleSubmit = (data: FormData) => {
    const tx = buildTransaction(data);
    broadcastTx(tx);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" isLoading={isPending}>
        Send Transaction
      </Button>
    </form>
  );
}
```

#### 5. Query Invalidation

```tsx
// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ['balance', address] });

// Invalidate all balance queries
queryClient.invalidateQueries({ queryKey: ['balance'] });

// Invalidate multiple related queries
const handleLogout = () => {
  queryClient.invalidateQueries({ queryKey: ['balance'] });
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
  queryClient.invalidateQueries({ queryKey: ['assets'] });
};

// Refetch immediately
queryClient.refetchQueries({ queryKey: ['balance', address] });
```

#### 6. Parallel Queries

```tsx
function Dashboard({ address }: { address: string }) {
  // All queries run in parallel
  const balanceQuery = useBalance(address);
  const transactionsQuery = useTransactions(address);
  const assetsQuery = useAssets(address);
  
  if (balanceQuery.isLoading || transactionsQuery.isLoading || assetsQuery.isLoading) {
    return <Spinner />;
  }
  
  return (
    <div>
      <BalanceCard balance={balanceQuery.data} />
      <TransactionList transactions={transactionsQuery.data} />
      <AssetList assets={assetsQuery.data} />
    </div>
  );
}

// Or use useQueries for dynamic list
function MultiAccountDashboard({ addresses }: { addresses: string[] }) {
  const balanceQueries = useQueries({
    queries: addresses.map(address => ({
      queryKey: ['balance', address],
      queryFn: () => addressApi.getBalance(address)
    }))
  });
  
  const allLoaded = balanceQueries.every(q => !q.isLoading);
  
  return <div>{/* ... */}</div>;
}
```

### React Query DevTools

```tsx
// App.tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

---

## Zustand - Client State

Zustand manages complex client-side state that doesn't belong in React Query (UI state, temporary data, computed values).

### DEX Store Example

```typescript
// stores/dexStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TradingPair {
  amountAsset: string;
  priceAsset: string;
  amountAssetName?: string;
  priceAssetName?: string;
}

interface Order {
  id: string;
  type: 'buy' | 'sell';
  price: string;
  amount: string;
  timestamp: number;
  status: 'pending' | 'filled' | 'partially_filled' | 'cancelled';
}

interface OrderBook {
  bids: Order[];
  asks: Order[];
  lastUpdate?: number;
}

interface DexState {
  // State
  selectedPair: TradingPair | null;
  orderBook: OrderBook;
  userOrders: Order[];
  
  // Actions
  setSelectedPair: (pair: TradingPair) => void;
  updateOrderBook: (orderBook: OrderBook) => void;
  addUserOrder: (order: Order) => void;
  removeUserOrder: (orderId: string) => void;
  clearUserOrders: () => void;
}

export const useDexStore = create<DexState>()(
  devtools(
    (set) => ({
      // Initial state
      selectedPair: null,
      orderBook: { bids: [], asks: [] },
      userOrders: [],
      
      // Actions
      setSelectedPair: (pair) => set({ selectedPair: pair }),
      
      updateOrderBook: (orderBook) => 
        set({ orderBook: { ...orderBook, lastUpdate: Date.now() } }),
      
      addUserOrder: (order) => 
        set((state) => ({ 
          userOrders: [order, ...state.userOrders] 
        })),
      
      removeUserOrder: (orderId) => 
        set((state) => ({ 
          userOrders: state.userOrders.filter(o => o.id !== orderId) 
        })),
      
      clearUserOrders: () => set({ userOrders: [] })
    }),
    { name: 'DexStore' } // For Redux DevTools
  )
);
```

### Component Usage

```tsx
// pages/dex/DexPage.tsx
function DexPage() {
  // Select only the state you need (prevents unnecessary re-renders)
  const selectedPair = useDexStore(state => state.selectedPair);
  const setSelectedPair = useDexStore(state => state.setSelectedPair);
  
  // Or destructure multiple values
  const { orderBook, updateOrderBook } = useDexStore();
  
  return (
    <div>
      <TradingPairSelector 
        value={selectedPair} 
        onChange={setSelectedPair} 
      />
      <OrderBook data={orderBook} />
    </div>
  );
}
```

### Selector Performance

```tsx
// ❌ Bad: Subscribes to entire store (re-renders on any change)
const state = useDexStore();
const { selectedPair } = state;

// ✅ Good: Only subscribes to selectedPair
const selectedPair = useDexStore(state => state.selectedPair);

// ✅ Good: Custom selector with comparison
const userOrderCount = useDexStore(
  state => state.userOrders.length,
  (a, b) => a === b // Only re-render if count changes
);
```

### Actions Outside Components

```tsx
// Can call actions from anywhere (not just components)
import { useDexStore } from '@/stores/dexStore';

// In a WebSocket handler
websocket.on('orderbook_update', (data) => {
  const { updateOrderBook } = useDexStore.getState();
  updateOrderBook(data);
});

// In an API callback
async function placeOrder(order: Order) {
  const response = await api.placeOrder(order);
  const { addUserOrder } = useDexStore.getState();
  addUserOrder(response);
}
```

### Persist State (Optional)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language })
    }),
    {
      name: 'settings-storage', // localStorage key
      partialize: (state) => ({ theme: state.theme, language: state.language })
    }
  )
);
```

---

## Context API - Global State

Context API manages truly global state that needs to be available everywhere (auth, theme, config).

### AuthContext Example

```tsx
// contexts/AuthContext.tsx
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface User {
  address: string;
  publicKey: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  accounts: User[];
  isLoading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => void;
  switchAccount: (address: string) => void;
  addAccount: (account: User) => void;
  removeAccount: (address: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Initialize from storage on mount
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedUser = sessionStorage.getItem('currentUser');
      if (storedUser) setUser(JSON.parse(storedUser));
      
      const storedAccounts = localStorage.getItem('allAccounts');
      if (storedAccounts) setAccounts(JSON.parse(storedAccounts));
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const login = useCallback(async (userData: User) => {
    setIsLoading(true);
    try {
      sessionStorage.setItem('currentUser', JSON.stringify(userData));
      setUser(userData);
      
      // Add to accounts if not exists
      const exists = accounts.some(acc => acc.address === userData.address);
      if (!exists) {
        const updated = [...accounts, userData];
        setAccounts(updated);
        localStorage.setItem('allAccounts', JSON.stringify(updated));
      }
    } finally {
      setIsLoading(false);
    }
  }, [accounts]);
  
  const logout = useCallback(() => {
    sessionStorage.removeItem('currentUser');
    setUser(null);
  }, []);
  
  const switchAccount = useCallback((address: string) => {
    const account = accounts.find(acc => acc.address === address);
    if (account) {
      sessionStorage.setItem('currentUser', JSON.stringify(account));
      setUser(account);
    }
  }, [accounts]);
  
  const addAccount = useCallback((account: User) => {
    const updated = [...accounts, account];
    setAccounts(updated);
    localStorage.setItem('allAccounts', JSON.stringify(updated));
  }, [accounts]);
  
  const removeAccount = useCallback((address: string) => {
    const updated = accounts.filter(acc => acc.address !== address);
    setAccounts(updated);
    localStorage.setItem('allAccounts', JSON.stringify(updated));
    
    // If removing current user, logout
    if (user?.address === address) {
      logout();
    }
  }, [accounts, user, logout]);
  
  const value = {
    user,
    accounts,
    isLoading,
    login,
    logout,
    switchAccount,
    addAccount,
    removeAccount
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for consuming context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### ThemeContext Example

```tsx
// contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '@/themes';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem('theme') as ThemeMode;
    return stored || 'light';
  });
  
  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const currentTheme = theme === 'light' ? lightTheme : darkTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <StyledThemeProvider theme={currentTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### ConfigContext Example

```tsx
// contexts/ConfigContext.tsx
interface Config {
  network: 'mainnet' | 'testnet' | 'stagenet';
  nodeUrl: string;
  matcherUrl: string;
  explorerUrl: string;
  chainId: string;
}

interface ConfigContextType {
  config: Config;
  setNetwork: (network: Config['network']) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<Config>(() => {
    const network = (localStorage.getItem('network') || 'mainnet') as Config['network'];
    return getConfigForNetwork(network);
  });
  
  const setNetwork = (network: Config['network']) => {
    localStorage.setItem('network', network);
    setConfig(getConfigForNetwork(network));
  };
  
  return (
    <ConfigContext.Provider value={{ config, setNetwork }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
};
```

### Provider Composition

```tsx
// App.tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ConfigProvider } from '@/contexts/ConfigContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <AuthProvider>
          <ThemeProvider>
            <RouterProvider router={router} />
          </ThemeProvider>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}
```

---

## Custom Hooks

Custom hooks encapsulate reusable state logic and provide clean APIs.

### useLocalStorage Hook

```tsx
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue] as const;
}

// Usage
function MyComponent() {
  const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', []);
  
  const addFavorite = (id: string) => {
    setFavorites(prev => [...prev, id]);
  };
  
  return <div>{/* ... */}</div>;
}
```

### useDebounce Hook

```tsx
// hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

// Usage: Search with debounce
function SearchAssets() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const { data: results } = useQuery({
    queryKey: ['search', debouncedSearch],
    queryFn: () => searchApi.search(debouncedSearch),
    enabled: debouncedSearch.length > 2
  });
  
  return (
    <Input 
      value={search} 
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search assets..."
    />
  );
}
```

### useToggle Hook

```tsx
// hooks/useToggle.ts
import { useState, useCallback } from 'react';

export function useToggle(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => setValue(v => !v), []);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  
  return { value, toggle, setTrue, setFalse, setValue };
}

// Usage
function Modal() {
  const modal = useToggle(false);
  
  return (
    <>
      <Button onClick={modal.setTrue}>Open Modal</Button>
      {modal.value && (
        <ModalComponent onClose={modal.setFalse}>
          Content
        </ModalComponent>
      )}
    </>
  );
}
```

---

## State Management Patterns

### Pattern 1: Derived State

```tsx
// ❌ Bad: Storing derived state
const [count, setCount] = useState(0);
const [doubled, setDoubled] = useState(0);

useEffect(() => {
  setDoubled(count * 2); // Unnecessary state + effect
}, [count]);

// ✅ Good: Compute derived state
const [count, setCount] = useState(0);
const doubled = count * 2; // Simple computation

// ✅ Good: Memoize expensive computations
const sortedItems = useMemo(() => {
  return items.sort((a, b) => a.name.localeCompare(b.name));
}, [items]);
```

### Pattern 2: State Colocation

```tsx
// ❌ Bad: Global state for local UI
const useGlobalStore = create((set) => ({
  isModalOpen: false,
  setIsModalOpen: (open) => set({ isModalOpen: open })
}));

// ✅ Good: Keep UI state local
function MyComponent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>Open</Button>
      {isModalOpen && <Modal onClose={() => setIsModalOpen(false)} />}
    </>
  );
}
```

### Pattern 3: Optimistic Updates

```tsx
// hooks/useLikeAsset.ts
export const useLikeAsset = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (assetId: string) => api.likeAsset(assetId),
    
    onMutate: async (assetId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['asset', assetId] });
      
      // Snapshot current value
      const previous = queryClient.getQueryData(['asset', assetId]);
      
      // Optimistic update
      queryClient.setQueryData(['asset', assetId], (old: Asset) => ({
        ...old,
        likes: old.likes + 1,
        isLiked: true
      }));
      
      return { previous };
    },
    
    onError: (err, assetId, context) => {
      // Rollback on error
      queryClient.setQueryData(['asset', assetId], context.previous);
    },
    
    onSettled: (assetId) => {
      // Refetch to sync with server
      queryClient.invalidateQueries({ queryKey: ['asset', assetId] });
    }
  });
};
```

### Pattern 4: Compound Components with Shared State

```tsx
// components/AssetSelector.tsx
interface AssetSelectorContextType {
  selectedAssets: string[];
  toggleAsset: (assetId: string) => void;
}

const AssetSelectorContext = createContext<AssetSelectorContextType | undefined>(undefined);

export function AssetSelector({ children }: { children: ReactNode }) {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  
  const toggleAsset = (assetId: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetId)
        ? prev.filter(id => id !== assetId)
        : [...prev, assetId]
    );
  };
  
  return (
    <AssetSelectorContext.Provider value={{ selectedAssets, toggleAsset }}>
      {children}
    </AssetSelectorContext.Provider>
  );
}

AssetSelector.Item = function AssetSelectorItem({ assetId, name }: { assetId: string; name: string }) {
  const { selectedAssets, toggleAsset } = useContext(AssetSelectorContext)!;
  const isSelected = selectedAssets.includes(assetId);
  
  return (
    <Checkbox 
      checked={isSelected}
      onChange={() => toggleAsset(assetId)}
      label={name}
    />
  );
};

// Usage
<AssetSelector>
  <AssetSelector.Item assetId="DCC" name="DecentralChain" />
  <AssetSelector.Item assetId="BTC" name="Bitcoin" />
</AssetSelector>
```

---

## Best Practices

### 1. Choose the Right Tool

| Scenario | Tool | Why |
|----------|------|-----|
| API data (balance, transactions) | React Query | Caching, sync, refetch |
| Complex UI state (DEX trading) | Zustand | Performance, simplicity |
| Global settings (auth, theme) | Context API | Built-in, no extra deps |
| Local UI state (form, modal) | useState | Simple, colocated |

### 2. Avoid Prop Drilling

```tsx
// ❌ Bad: Prop drilling through many levels
<Parent address={address}>
  <Child address={address}>
    <Grandchild address={address}>
      <GreatGrandchild address={address} />
    </Grandchild>
  </Child>
</Parent>

// ✅ Good: Use context for deeply nested state
const { user } = useAuth();
const address = user?.address;
```

### 3. Minimize Re-renders

```tsx
// ❌ Bad: Subscribes to entire store
const store = useDexStore();

// ✅ Good: Select only what you need
const selectedPair = useDexStore(state => state.selectedPair);

// ✅ Good: Separate selectors for different parts
const amountAsset = useDexStore(state => state.selectedPair?.amountAsset);
const priceAsset = useDexStore(state => state.selectedPair?.priceAsset);
```

### 4. Type Safety

```tsx
// Always provide TypeScript types
interface DexState {
  selectedPair: TradingPair | null;
  updatePair: (pair: TradingPair) => void;
}

const useDexStore = create<DexState>((set) => ({ /* ... */ }));

// Use type inference with React Query
const { data } = useQuery<Balance, Error>({
  queryKey: ['balance', address],
  queryFn: () => addressApi.getBalance(address)
});
```

### 5. Error Handling

```tsx
// React Query errors
const { data, error, isError } = useBalance(address);

if (isError) {
  return <ErrorMessage error={error} />;
}

// Zustand actions with try-catch
const addUserOrder = (order: Order) => {
  try {
    set((state) => ({ userOrders: [order, ...state.userOrders] }));
    toast.success('Order placed');
  } catch (error) {
    console.error('Failed to add order:', error);
    toast.error('Failed to place order');
  }
};
```

---

## Testing State

### Testing React Query Hooks

```tsx
// __tests__/useBalance.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBalance } from '@/hooks/useBalance';
import { addressApi } from '@/services/api';

jest.mock('@/services/api');

describe('useBalance', () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  
  it('should fetch balance successfully', async () => {
    (addressApi.getBalance as jest.Mock).mockResolvedValue({ available: 1000 });
    
    const { result } = renderHook(() => useBalance('3P...'), { wrapper });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    
    expect(result.current.data).toEqual({ available: 1000 });
  });
});
```

### Testing Zustand Stores

```tsx
// __tests__/dexStore.test.ts
import { act, renderHook } from '@testing-library/react';
import { useDexStore } from '@/stores/dexStore';

describe('DexStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { clearUserOrders } = useDexStore.getState();
    clearUserOrders();
  });
  
  it('should add user order', () => {
    const { result } = renderHook(() => useDexStore());
    
    const order = { id: '1', type: 'buy', price: '100', amount: '10', timestamp: Date.now() };
    
    act(() => {
      result.current.addUserOrder(order);
    });
    
    expect(result.current.userOrders).toHaveLength(1);
    expect(result.current.userOrders[0]).toEqual(order);
  });
});
```

### Testing Context

```tsx
// __tests__/AuthContext.test.tsx
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

describe('AuthContext', () => {
  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
  
  it('should login user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    const user = { address: '3P...', publicKey: 'pub...' };
    
    await act(async () => {
      await result.current.login(user);
    });
    
    expect(result.current.user).toEqual(user);
    expect(result.current.accounts).toContainEqual(user);
  });
  
  it('should logout user', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.user).toBeNull();
  });
});
```

---

## Migration from Angular

### Angular Services → React Patterns

```typescript
// Angular Service
@Injectable({ providedIn: 'root' })
export class WalletService {
  private balanceSubject = new BehaviorSubject<number>(0);
  public balance$ = this.balanceSubject.asObservable();
  
  constructor(private http: HttpClient) {}
  
  loadBalance(address: string): void {
    this.http.get<number>(`/api/balance/${address}`)
      .subscribe(balance => this.balanceSubject.next(balance));
  }
}

// React with React Query
export const useBalance = (address: string) => {
  return useQuery({
    queryKey: ['balance', address],
    queryFn: () => addressApi.getBalance(address),
    refetchInterval: 30000
  });
};
```

### Migration Mapping

| Angular Pattern | React Pattern | Notes |
|----------------|---------------|-------|
| `@Injectable` service | Custom hook + React Query | Server state |
| `BehaviorSubject` | Zustand store | Client state |
| `@Input()` | Props | Component input |
| `@Output() EventEmitter` | Callback props | Component output |
| `ngOnInit` | `useEffect(() => {}, [])` | Mount effect |
| `ngOnDestroy` | `return () => {}` cleanup | Unmount effect |
| `*ngIf` | `{condition && <Component />}` | Conditional |
| `*ngFor` | `.map()` | List rendering |

---

## Resources

### Official Documentation
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [React Context Documentation](https://react.dev/learn/passing-data-deeply-with-context)

### Additional Reading
- [Kent C. Dodds: Application State Management](https://kentcdodds.com/blog/application-state-management-with-react)
- [React Query vs Redux](https://tkdodo.eu/blog/react-query-as-a-state-manager)

---

**Last Updated**: January 2025  
**Version**: 1.0.0
