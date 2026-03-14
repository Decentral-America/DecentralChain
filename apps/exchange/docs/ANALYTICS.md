# Analytics Tracking Guide

## Overview

The DCC Wallet React application includes comprehensive analytics tracking using Google Analytics 4 (GA4) and Amplitude. This guide covers setup, usage, and best practices.

## Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Core Functions](#core-functions)
- [React Hooks](#react-hooks)
- [Usage Examples](#usage-examples)
- [Predefined Events](#predefined-events)
- [Best Practices](#best-practices)
- [Privacy & GDPR](#privacy--gdpr)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Install Dependencies

```bash
npm install react-ga4
```

### 2. Configure Environment Variables

Create `.env` file (or use `.env.example` as template):

```env
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_AMPLITUDE_KEY=your-amplitude-key-here
```

### 3. Initialize in App

Analytics is automatically initialized in `App.tsx`:

```tsx
import { initAnalytics } from '@/lib/analytics';

useEffect(() => {
  initAnalytics();
}, []);
```

### 4. Track Events in Components

```tsx
import { analytics } from '@/lib/analytics';

function SendButton() {
  const handleSend = () => {
    analytics.transactionSent(100, 'DCC');
  };
  
  return <Button onClick={handleSend}>Send</Button>;
}
```

---

## Configuration

### Analytics Configuration Options

```typescript
interface AnalyticsConfig {
  /** Google Analytics 4 Measurement ID */
  gaId?: string;
  
  /** Amplitude API Key */
  amplitudeKey?: string;
  
  /** Enable debug mode */
  debug?: boolean;
  
  /** Enable in development */
  enableInDev?: boolean;
  
  /** User ID for tracking */
  userId?: string;
}
```

### Custom Configuration

```tsx
import { initAnalytics } from '@/lib/analytics';

initAnalytics({
  gaId: 'G-XXXXXXXXXX',
  amplitudeKey: 'your-key',
  debug: true,
  enableInDev: true, // Enable analytics in development
});
```

### Environment Variables

All environment variables are prefixed with `VITE_`:

```env
# Required for Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Required for Amplitude
VITE_AMPLITUDE_KEY=your-amplitude-key

# Optional configuration
VITE_ENABLE_ANALYTICS_IN_DEV=false
```

---

## Core Functions

### Initialize Analytics

```typescript
import { initAnalytics } from '@/lib/analytics';

initAnalytics({
  debug: import.meta.env.DEV,
  enableInDev: false,
});
```

**Note**: Analytics are disabled in development by default. Set `enableInDev: true` to test.

### Track Page View

```typescript
import { trackPageView } from '@/lib/analytics';

// Simple page view
trackPageView('/wallet/portfolio');

// With title
trackPageView('/wallet', 'Wallet Overview');
```

**Auto-tracking**: Page views are automatically tracked in `App.tsx` using the `usePageTracking()` hook.

### Track Event

```typescript
import { trackEvent } from '@/lib/analytics';

// Basic event
trackEvent('Button', 'click', 'Send Transaction');

// With value
trackEvent('Transaction', 'send', 'DCC', 100);

// With custom parameters
trackEvent('DEX', 'trade', 'DCC/USDT', 1000, {
  pair: 'DCC/USDT',
  side: 'buy',
  price: 0.5,
});
```

### Set User ID

```typescript
import { setUserId } from '@/lib/analytics';

// When user logs in
setUserId(user.address);
```

### Set User Properties

```typescript
import { setUserProperties } from '@/lib/analytics';

setUserProperties({
  plan: 'premium',
  language: 'en',
  theme: 'dark',
  balance_tier: 'high',
});
```

### Track Transaction

```typescript
import { trackTransaction } from '@/lib/analytics';

trackTransaction('tx-123', 100, 'DCC', {
  type: 'send',
  recipient: '3P...',
  fee: 0.001,
});
```

### Track Purchase (E-commerce)

```typescript
import { trackPurchase } from '@/lib/analytics';

trackPurchase('tx-123', 100, 'DCC', [
  {
    item_id: 'asset-1',
    item_name: 'Premium Asset',
    price: 100,
    quantity: 1,
  },
]);
```

### Track Timing

```typescript
import { trackTiming } from '@/lib/analytics';

// Track API response time
const start = Date.now();
await fetchData();
trackTiming('API', 'fetch_transactions', Date.now() - start);
```

### Track Exception

```typescript
import { trackException } from '@/lib/analytics';

try {
  await sendTransaction();
} catch (error) {
  trackException(error.message, false);
}
```

### Clear User Data

```typescript
import { clearUser } from '@/lib/analytics';

// On logout
const handleLogout = () => {
  clearUser();
  // ... logout logic ...
};
```

---

## React Hooks

### usePageTracking

Automatically track page views on route changes:

```tsx
import { usePageTracking } from '@/hooks/useAnalytics';

function App() {
  usePageTracking(); // Tracks all route changes
  
  return <RouterProvider router={router} />;
}
```

**Already configured in App.tsx**.

### useComponentTiming

Track component mount time:

```tsx
import { useComponentTiming } from '@/hooks/useAnalytics';

function Dashboard() {
  useComponentTiming('Dashboard');
  
  return <div>...</div>;
}
```

### useApiTiming

Track API call duration:

```tsx
import { useApiTiming } from '@/hooks/useAnalytics';

function useTransactions() {
  const trackApiTiming = useApiTiming();
  
  const { data } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      return trackApiTiming('fetch_transactions', async () => {
        return await api.getTransactions();
      });
    },
  });
  
  return { data };
}
```

### useAnalytics

Track events with automatic category context:

```tsx
import { useAnalytics } from '@/hooks/useAnalytics';

function SendButton() {
  const track = useAnalytics('Transaction');
  
  const handleSend = () => {
    track('send', 'DCC', 100);
  };
  
  return <Button onClick={handleSend}>Send</Button>;
}
```

### useFeatureTracking

Track feature usage on component mount:

```tsx
import { useFeatureTracking } from '@/hooks/useAnalytics';

function AdvancedTradingView() {
  useFeatureTracking('advanced_trading');
  
  return <div>...</div>;
}
```

### useFormTracking

Track form interactions:

```tsx
import { useFormTracking } from '@/hooks/useAnalytics';

function LoginForm() {
  const { trackStart, trackComplete, trackError } = useFormTracking('login');
  
  const handleSubmit = async (data) => {
    trackStart();
    
    try {
      await login(data);
      trackComplete();
    } catch (error) {
      trackError(error.message);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... form fields ... */}
    </form>
  );
}
```

### useButtonTracking

Track button clicks:

```tsx
import { useButtonTracking } from '@/hooks/useAnalytics';

function SendButton() {
  const handleClick = useButtonTracking('send_transaction', {
    asset: 'DCC',
    amount: 100,
  });
  
  return (
    <Button onClick={(e) => {
      handleClick(e);
      // ... your logic ...
    }}>
      Send
    </Button>
  );
}
```

### useModalTracking

Track modal open/close:

```tsx
import { useModalTracking } from '@/hooks/useAnalytics';

function SettingsModal({ open, onClose }) {
  useModalTracking('settings_modal', open);
  
  return (
    <Modal open={open} onClose={onClose}>
      {/* ... modal content ... */}
    </Modal>
  );
}
```

### useErrorTracking

Track errors in components:

```tsx
import { useErrorTracking } from '@/hooks/useAnalytics';

function DataComponent() {
  const trackError = useErrorTracking();
  
  const { data, error } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    onError: (error) => {
      trackError('API Error', error.message, false);
    },
  });
  
  return <div>...</div>;
}
```

---

## Usage Examples

### Wallet Events

```tsx
import { analytics } from '@/lib/analytics';

// Wallet created
analytics.walletCreated();

// Wallet imported
analytics.walletImported();

// Wallet backed up
analytics.walletBackedUp();
```

### Transaction Events

```tsx
import { analytics } from '@/lib/analytics';

// Transaction sent
const handleSend = async (amount: number, asset: string) => {
  await sendTransaction(amount, asset);
  analytics.transactionSent(amount, asset);
};

// Transaction received (from websocket)
socket.on('transaction', (tx) => {
  analytics.transactionReceived(tx.amount, tx.asset);
});
```

### DEX Events

```tsx
import { analytics } from '@/lib/analytics';

// Order placed
const handlePlaceOrder = async (order) => {
  await placeOrder(order);
  analytics.orderPlaced(order.pair, order.side, order.amount);
};

// Order cancelled
const handleCancelOrder = async (orderId, pair) => {
  await cancelOrder(orderId);
  analytics.orderCancelled(pair);
};

// Trade executed
socket.on('trade', (trade) => {
  analytics.tradeExecuted(trade.pair, trade.amount, trade.price);
});
```

### Leasing Events

```tsx
import { analytics } from '@/lib/analytics';

// Start leasing
const handleStartLeasing = async (amount) => {
  await startLeasing(amount);
  analytics.leasingStarted(amount);
};

// Cancel leasing
const handleCancelLeasing = async () => {
  await cancelLeasing();
  analytics.leasingCancelled();
};
```

### Settings Events

```tsx
import { analytics } from '@/lib/analytics';

// Theme changed
const handleThemeChange = (theme) => {
  setTheme(theme);
  analytics.themeChanged(theme);
};

// Language changed
const handleLanguageChange = (language) => {
  setLanguage(language);
  analytics.languageChanged(language);
};
```

### Search Events

```tsx
import { analytics } from '@/lib/analytics';

const handleSearch = async (query) => {
  const results = await search(query);
  analytics.searchPerformed(query, results.length);
};
```

### Help Events

```tsx
import { analytics } from '@/lib/analytics';

const handleViewHelp = (topic) => {
  openHelpModal(topic);
  analytics.helpViewed(topic);
};

const handleContactSupport = (method) => {
  openSupport(method);
  analytics.supportContacted(method);
};
```

---

## Predefined Events

The `analytics` object provides convenient methods for common events:

```typescript
import { analytics } from '@/lib/analytics';

analytics.walletCreated();
analytics.walletImported();
analytics.walletBackedUp();
analytics.transactionSent(amount, asset);
analytics.transactionReceived(amount, asset);
analytics.orderPlaced(pair, side, amount);
analytics.orderCancelled(pair);
analytics.tradeExecuted(pair, amount, price);
analytics.leasingStarted(amount);
analytics.leasingCancelled();
analytics.themeChanged(theme);
analytics.languageChanged(language);
analytics.featureUsed(feature);
analytics.searchPerformed(query, resultsCount);
analytics.helpViewed(topic);
analytics.supportContacted(method);
```

---

## Best Practices

### 1. Event Naming Convention

Use consistent naming for events:

```typescript
// Good
trackEvent('Transaction', 'send', 'DCC');
trackEvent('DEX', 'order_placed', 'DCC/USDT');
trackEvent('Settings', 'theme_changed', 'dark');

// Bad
trackEvent('send_tx', 'click', 'button');
trackEvent('order', 'placed', 'dex');
```

**Format**: `Category`, `Action`, `Label`

### 2. Use Predefined Events

Use `analytics` object for common events instead of `trackEvent`:

```typescript
// Good
analytics.transactionSent(100, 'DCC');

// Acceptable but less preferred
trackEvent('Transaction', 'send', 'DCC', 100);
```

### 3. Track Meaningful Data

```typescript
// Good - Includes context
trackEvent('DEX', 'trade', 'DCC/USDT', 1000, {
  pair: 'DCC/USDT',
  side: 'buy',
  price: 0.5,
  orderType: 'market',
});

// Bad - Missing context
trackEvent('DEX', 'trade');
```

### 4. Don't Track PII

Never track personally identifiable information:

```typescript
// BAD - Don't do this!
trackEvent('User', 'login', user.email); // ❌
trackEvent('Transaction', 'send', user.name); // ❌

// Good - Use anonymous IDs
trackEvent('User', 'login', user.id);
setUserId(user.address); // Wallet address as user ID
```

### 5. Track Errors Gracefully

```typescript
try {
  await sendTransaction();
} catch (error) {
  // Track error but don't expose sensitive data
  trackException(
    error.code || 'unknown_error',
    error.fatal || false
  );
}
```

### 6. Use Hooks for Automatic Tracking

```typescript
// Good - Automatic tracking
function Dashboard() {
  usePageTracking(); // Auto tracks route changes
  useFeatureTracking('dashboard'); // Tracks feature usage
  
  return <div>...</div>;
}

// Less efficient - Manual tracking
function Dashboard() {
  useEffect(() => {
    trackEvent('Page', 'view', 'dashboard');
  }, []);
  
  return <div>...</div>;
}
```

### 7. Batch Similar Events

```typescript
// Good - Single comprehensive event
trackEvent('Wallet', 'settings_changed', undefined, undefined, {
  theme: 'dark',
  language: 'en',
  notifications: true,
});

// Bad - Multiple small events
trackEvent('Settings', 'theme', 'dark');
trackEvent('Settings', 'language', 'en');
trackEvent('Settings', 'notifications', 'true');
```

---

## Privacy & GDPR

### User Consent

```tsx
import { initAnalytics, clearUser } from '@/lib/analytics';

function App() {
  const [consent, setConsent] = useState(false);
  
  useEffect(() => {
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    setConsent(hasConsent);
    
    if (hasConsent) {
      initAnalytics();
    }
  }, []);
  
  const handleAcceptConsent = () => {
    localStorage.setItem('analytics-consent', 'true');
    setConsent(true);
    initAnalytics();
  };
  
  const handleRevokeConsent = () => {
    localStorage.removeItem('analytics-consent');
    setConsent(false);
    clearUser();
  };
  
  return (
    <>
      {!consent && (
        <ConsentBanner onAccept={handleAcceptConsent} />
      )}
      <App />
    </>
  );
}
```

### Data Retention

Configure data retention in Google Analytics:
1. Go to Admin > Data Settings > Data Retention
2. Set appropriate retention period (e.g., 14 months)
3. Enable "Reset user data on new activity"

### IP Anonymization

GA4 automatically anonymizes IP addresses. No additional configuration needed.

---

## Testing

### Development Testing

Enable analytics in development:

```tsx
initAnalytics({
  debug: true,
  enableInDev: true,
});
```

Check browser console for debug logs:
```
[Analytics] Google Analytics initialized: G-XXXXXXXXXX
[Analytics] Page view tracked: { path: '/wallet', title: 'Wallet' }
[Analytics] Event tracked: { category: 'Transaction', action: 'send', ... }
```

### Unit Testing

```tsx
import { render, screen } from '@testing-library/react';
import { trackEvent } from '@/lib/analytics';

// Mock analytics
jest.mock('@/lib/analytics', () => ({
  trackEvent: jest.fn(),
}));

describe('SendButton', () => {
  it('tracks transaction event on click', async () => {
    const { getByText } = render(<SendButton />);
    
    const button = getByText('Send');
    await userEvent.click(button);
    
    expect(trackEvent).toHaveBeenCalledWith(
      'Transaction',
      'send',
      'DCC',
      100
    );
  });
});
```

### Real-Time Testing

1. Go to Google Analytics
2. Navigate to Reports > Realtime
3. Perform actions in your app
4. Verify events appear in real-time report

### Debug View (GA4)

1. Install Google Analytics Debugger extension
2. Open your app
3. Events are sent to Debug View in GA4
4. Go to Configure > DebugView in GA4

---

## Troubleshooting

### Events Not Tracking

**1. Check initialization:**
```typescript
// Add debug logs
initAnalytics({
  debug: true,
  enableInDev: true,
});
```

**2. Check environment variables:**
```bash
echo $VITE_GA_MEASUREMENT_ID
```

**3. Check browser console:**
Look for analytics logs or errors.

**4. Check ad blockers:**
Disable ad blockers that may block analytics scripts.

### Development Mode Issues

Analytics are disabled in development by default:

```typescript
// Enable for testing
initAnalytics({
  enableInDev: true,
});
```

### TypeScript Errors

If you see TypeScript errors for `window.amplitude`:

```typescript
// Already declared in lib/analytics.ts
declare global {
  interface Window {
    amplitude?: { ... };
  }
}
```

### Amplitude Not Initializing

Ensure `amplitude.js` is loaded in `index.html`:

```html
<script src="/amplitude.js"></script>
```

### Duplicate Events

Check if tracking is called multiple times:

```tsx
// Bad - Tracks twice
useEffect(() => {
  trackEvent('Page', 'view');
}, []); // Missing dependency

useEffect(() => {
  trackEvent('Page', 'view');
}, [location]); // Tracks on every route change
```

---

## Related Documentation

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Amplitude Documentation](https://developers.amplitude.com/)
- [React GA4 Documentation](https://github.com/codler/react-ga4)

---

## Additional Resources

### Google Analytics Setup

1. Create GA4 property: https://analytics.google.com/
2. Get Measurement ID (G-XXXXXXXXXX)
3. Add to `.env`: `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX`

### Amplitude Setup

1. Create Amplitude account: https://amplitude.com/
2. Get API key
3. Add to `.env`: `VITE_AMPLITUDE_KEY=your-key`

---

## Contributing

When adding analytics tracking:

1. **Use predefined events** when possible
2. **Follow naming conventions**: Category > Action > Label
3. **Document new events** in this guide
4. **Test in development** with `enableInDev: true`
5. **Don't track PII** (emails, names, addresses)
6. **Add unit tests** for tracking calls

---

## License

MIT License - See [LICENSE](../LICENSE) file for details
