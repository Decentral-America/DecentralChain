# Screen Reader Support Guide

## Overview

The DCC Wallet React application provides comprehensive screen reader support through ARIA live regions, ensuring all dynamic content changes are properly announced to assistive technology users.

## Table of Contents

- [Components](#components)
  - [LiveRegion](#liveregion)
  - [AnnouncementProvider](#announcementprovider)
- [Hooks](#hooks)
  - [useAnnounce](#useannounce)
  - [useAnnouncement](#useannouncement)
- [Integration Examples](#integration-examples)
- [Best Practices](#best-practices)
- [Testing](#testing)
- [WCAG Compliance](#wcag-compliance)

---

## Components

### LiveRegion

The `LiveRegion` component creates an ARIA live region for screen reader announcements. Messages are announced to screen readers but hidden visually.

#### Props

```typescript
interface LiveRegionProps {
  /** Message to announce to screen readers */
  message: string;
  
  /** 
   * Announcement priority
   * - 'polite': Wait for user to finish current action (default)
   * - 'assertive': Interrupt immediately
   */
  politeness?: 'polite' | 'assertive';
  
  /** 
   * Whether to announce the entire region or only changes
   * @default true
   */
  atomic?: boolean;
  
  /** 
   * Automatically clear message after duration (ms)
   * Set to 0 to disable auto-clear
   * @default 5000
   */
  clearAfter?: number;
  
  /** Callback when message is cleared */
  onClear?: () => void;
  
  /** 
   * Debounce announcements (ms) to prevent rapid-fire announcements
   * @default 100
   */
  debounceMs?: number;
}
```

#### Basic Usage

```tsx
import { LiveRegion } from '@/components/a11y';

function App() {
  const [message, setMessage] = useState('');
  
  const handleSave = async () => {
    try {
      await saveData();
      setMessage('Data saved successfully');
    } catch (error) {
      setMessage('Error: Could not save data');
    }
  };
  
  return (
    <>
      <Button onClick={handleSave}>Save</Button>
      <LiveRegion message={message} />
    </>
  );
}
```

#### Politeness Levels

**Polite (Default)** - For non-urgent updates:
```tsx
<LiveRegion 
  message="3 new notifications" 
  politeness="polite" 
/>
```

**Assertive** - For critical alerts that need immediate attention:
```tsx
<LiveRegion 
  message="Error: Payment failed" 
  politeness="assertive" 
/>
```

#### Advanced Usage

```tsx
// With auto-clear callback
<LiveRegion 
  message={status}
  clearAfter={3000}
  onClear={() => setStatus('')}
/>

// Disable auto-clear
<LiveRegion 
  message="Persistent message"
  clearAfter={0}
/>

// Custom debounce
<LiveRegion 
  message={searchResults}
  debounceMs={300}
/>
```

---

### AnnouncementProvider

Global announcement provider for app-wide screen reader announcements. Manages multiple announcements and handles queuing automatically.

#### Setup

Wrap your application with `AnnouncementProvider` (already configured in App.tsx):

```tsx
import { AnnouncementProvider } from '@/components/a11y';

function App() {
  return (
    <AnnouncementProvider>
      <YourApp />
    </AnnouncementProvider>
  );
}
```

#### Features

- **Queue Management**: Handles multiple announcements automatically
- **Deduplication**: Prevents duplicate announcements
- **Auto-Cleanup**: Removes announcements after they're announced
- **Context API**: Access from any component via `useAnnouncement` hook

---

## Hooks

### useAnnounce

Simple hook for component-level announcements. Returns an `announce` function and a component to render.

#### Basic Usage

```tsx
import { useAnnounce } from '@/components/a11y';

function SaveButton() {
  const { announce, LiveRegionComponent } = useAnnounce();
  
  const handleSave = async () => {
    try {
      await saveData();
      announce('Data saved successfully');
    } catch (error) {
      announce('Error: Could not save data', 'assertive');
    }
  };
  
  return (
    <>
      <Button onClick={handleSave}>Save</Button>
      <LiveRegionComponent />
    </>
  );
}
```

#### API

```typescript
function useAnnounce(): {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
  LiveRegionComponent: React.FC;
}
```

---

### useAnnouncement

Access global announcement system from `AnnouncementProvider`. Use this for announcements that should be handled globally.

#### Basic Usage

```tsx
import { useAnnouncement } from '@/components/a11y';

function MyComponent() {
  const { announce } = useAnnouncement();
  
  const handleAction = () => {
    // Polite announcement
    announce('Action completed');
    
    // Assertive announcement for errors
    announce('Critical error occurred', 'assertive');
  };
  
  return (
    <Button onClick={handleAction}>
      Perform Action
    </Button>
  );
}
```

#### API

```typescript
function useAnnouncement(): {
  announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}
```

---

## Integration Examples

### Form Validation

Announce validation errors to screen readers:

```tsx
import { useAnnouncement } from '@/components/a11y';

function LoginForm() {
  const { announce } = useAnnouncement();
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleSubmit = async (data: FormData) => {
    const validationErrors = validate(data);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      
      // Announce first error to screen reader
      const firstError = Object.values(validationErrors)[0];
      announce(`Validation error: ${firstError}`, 'assertive');
      
      return;
    }
    
    try {
      await login(data);
      announce('Login successful');
    } catch (error) {
      announce('Login failed: Invalid credentials', 'assertive');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <Input 
        name="email" 
        error={errors.email}
        aria-invalid={!!errors.email}
      />
      <Input 
        name="password" 
        type="password"
        error={errors.password}
        aria-invalid={!!errors.password}
      />
      <Button type="submit">Login</Button>
    </form>
  );
}
```

### Toast Integration

The `ToastProvider` automatically announces toast messages:

```tsx
// ToastProvider implementation (already configured)
import { useAnnouncement } from '@/components/a11y';

export const ToastProvider = ({ children }) => {
  const { announce } = useAnnouncement();
  
  const showToast = (message: string, type: ToastType) => {
    // ... show visual toast ...
    
    // Announce to screen readers
    const politeness = type === 'error' ? 'assertive' : 'polite';
    const prefix = type.charAt(0).toUpperCase() + type.slice(1);
    announce(`${prefix}: ${message}`, politeness);
  };
  
  return (
    // ... toast UI ...
  );
};

// Usage in components
function SaveButton() {
  const { showSuccess, showError } = useToast();
  
  const handleSave = async () => {
    try {
      await saveData();
      showSuccess('Data saved'); // Automatically announced
    } catch (error) {
      showError('Save failed'); // Automatically announced (assertive)
    }
  };
  
  return <Button onClick={handleSave}>Save</Button>;
}
```

### Loading States

Announce loading state changes:

```tsx
import { useAnnouncement } from '@/components/a11y';

function DataTable() {
  const { announce } = useAnnouncement();
  const { data, isLoading } = useQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    onSuccess: () => {
      announce('Data loaded successfully');
    },
    onError: () => {
      announce('Failed to load data', 'assertive');
    },
  });
  
  useEffect(() => {
    if (isLoading) {
      announce('Loading data...');
    }
  }, [isLoading, announce]);
  
  return (
    <div>
      {isLoading && <Spinner aria-label="Loading" />}
      {data && <Table data={data} />}
    </div>
  );
}
```

### Route Changes

Announce page navigation:

```tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAnnouncement } from '@/components/a11y';

function RouteAnnouncer() {
  const location = useLocation();
  const { announce } = useAnnouncement();
  
  useEffect(() => {
    // Extract page title from route
    const pageTitle = getPageTitle(location.pathname);
    announce(`Navigated to ${pageTitle}`);
  }, [location, announce]);
  
  return null;
}

// Add to App.tsx
function App() {
  return (
    <Router>
      <RouteAnnouncer />
      <Routes>
        {/* ... routes ... */}
      </Routes>
    </Router>
  );
}
```

### Search Results

Announce search result counts:

```tsx
import { useAnnouncement } from '@/components/a11y';

function SearchResults() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const { announce } = useAnnouncement();
  
  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    const data = await searchAPI(searchQuery);
    setResults(data);
    
    // Announce result count
    if (data.length === 0) {
      announce('No results found');
    } else if (data.length === 1) {
      announce('1 result found');
    } else {
      announce(`${data.length} results found`);
    }
  };
  
  return (
    <>
      <SearchInput onSearch={handleSearch} />
      <ResultsList results={results} />
    </>
  );
}
```

### Async Actions

Announce progress for long-running operations:

```tsx
import { useAnnouncement } from '@/components/a11y';

function FileUploader() {
  const { announce } = useAnnouncement();
  
  const handleUpload = async (file: File) => {
    announce('Upload started');
    
    try {
      await uploadFile(file, {
        onProgress: (percent) => {
          if (percent % 25 === 0) {
            announce(`Upload ${percent}% complete`);
          }
        },
      });
      
      announce('Upload complete');
    } catch (error) {
      announce('Upload failed', 'assertive');
    }
  };
  
  return <FileInput onUpload={handleUpload} />;
}
```

---

## Best Practices

### Politeness Levels

**Use `polite` (default) for:**
- Success messages
- Informational updates
- Search result counts
- Loading complete notifications
- Form submission success
- Non-critical warnings
- Progress updates

**Use `assertive` for:**
- Error messages
- Critical alerts
- Payment failures
- Session expiration warnings
- Security alerts
- Connection lost notifications

### Message Content

**Good Messages:**
```tsx
// Specific and actionable
announce('Email address is required');

// Clear outcome
announce('Transaction sent successfully');

// Helpful context
announce('3 new notifications received');
```

**Avoid:**
```tsx
// Too vague
announce('Error');

// Too technical
announce('HTTP 500: Internal Server Error');

// Too verbose
announce('The transaction has been successfully processed and confirmed on the blockchain network after 3 confirmations...');
```

### Timing

```tsx
// ✅ Good: Announce after action completes
const handleSave = async () => {
  await saveData();
  announce('Saved'); // Announce after success
};

// ❌ Bad: Announce before action starts
const handleSave = async () => {
  announce('Saving...'); // Don't announce optimistically
  await saveData();
};

// ✅ Good: Announce both loading and completion
const handleSave = async () => {
  announce('Saving data...');
  await saveData();
  announce('Data saved successfully');
};
```

### Debouncing

Prevent announcement spam for rapid changes:

```tsx
// ✅ Good: Debounced search announcements
<LiveRegion 
  message={searchResultCount}
  debounceMs={300}
/>

// ❌ Bad: Every keystroke triggers announcement
{query.length > 0 && (
  <LiveRegion message={`${results.length} results`} />
)}
```

### Auto-Clear

```tsx
// ✅ Good: Auto-clear temporary messages
<LiveRegion 
  message="Copied to clipboard"
  clearAfter={2000}
/>

// ✅ Good: Keep important messages
<LiveRegion 
  message="Payment failed"
  clearAfter={0} // Don't auto-clear errors
/>
```

### Avoid Over-Announcing

```tsx
// ❌ Bad: Too many announcements
const handleClick = () => {
  announce('Button clicked');
  announce('Processing...');
  announce('Starting operation...');
};

// ✅ Good: Single meaningful announcement
const handleClick = () => {
  announce('Processing request...');
};
```

---

## Testing

### Manual Testing

#### NVDA (Windows - Free)
```bash
1. Download from https://www.nvaccess.org/
2. Install and launch NVDA
3. Navigate to application
4. Trigger actions that should announce
5. Listen for announcements
```

#### JAWS (Windows - Paid)
```bash
1. Download from https://www.freedomscientific.com/
2. Install and launch JAWS
3. Navigate to application
4. Trigger actions
5. Verify announcements
```

#### VoiceOver (macOS - Built-in)
```bash
# Enable VoiceOver
Cmd + F5

# Navigate
Ctrl + Option + Arrow Keys

# Interact with element
Ctrl + Option + Space

# Disable
Cmd + F5
```

#### TalkBack (Android - Built-in)
```bash
1. Settings > Accessibility > TalkBack
2. Enable TalkBack
3. Open application
4. Test announcements
```

### Automated Testing

#### Using @testing-library/react

```tsx
import { render, screen } from '@testing-library/react';
import { LiveRegion } from '@/components/a11y';

describe('LiveRegion', () => {
  it('renders message for screen readers', () => {
    const { container } = render(
      <LiveRegion message="Test message" />
    );
    
    const liveRegion = container.querySelector('[role="status"]');
    expect(liveRegion).toHaveTextContent('Test message');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
  
  it('uses assertive for errors', () => {
    const { container } = render(
      <LiveRegion 
        message="Error occurred" 
        politeness="assertive" 
      />
    );
    
    const liveRegion = container.querySelector('[role="alert"]');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });
  
  it('clears message after duration', async () => {
    jest.useFakeTimers();
    
    const { container } = render(
      <LiveRegion 
        message="Temporary" 
        clearAfter={1000} 
      />
    );
    
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    
    jest.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).not.toBeInTheDocument();
    });
    
    jest.useRealTimers();
  });
});
```

#### Testing Announcements in Components

```tsx
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnouncementProvider } from '@/components/a11y';

describe('Component with announcements', () => {
  it('announces success message', async () => {
    const { container, getByText } = render(
      <AnnouncementProvider>
        <SaveButton />
      </AnnouncementProvider>
    );
    
    const button = getByText('Save');
    await userEvent.click(button);
    
    // Wait for announcement
    await waitFor(() => {
      const liveRegion = container.querySelector('[role="status"]');
      expect(liveRegion).toHaveTextContent('Success: Data saved');
    });
  });
});
```

---

## WCAG Compliance

### WCAG 2.1 Success Criteria

Our screen reader implementation meets the following criteria:

#### Level A

- **1.3.1 Info and Relationships (A)**: ARIA live regions properly convey information and relationships
- **4.1.3 Status Messages (A)**: Status changes announced without receiving focus

#### Level AA

- **2.4.3 Focus Order (AA)**: Announcements don't interrupt focus order
- **3.3.1 Error Identification (AA)**: Errors announced with assertive politeness
- **3.3.3 Error Suggestion (AA)**: Error announcements include helpful messages

#### Level AAA

- **2.2.4 Interruptions (AAA)**: Non-urgent announcements use polite politeness
- **3.3.6 Error Prevention (AAA)**: Errors announced before submission completes

### Implementation Checklist

- [x] ARIA live regions for dynamic content
- [x] Polite announcements for non-urgent updates
- [x] Assertive announcements for errors and alerts
- [x] Messages are clear and concise
- [x] Announcements don't steal focus
- [x] Auto-clear prevents announcement buildup
- [x] Debouncing prevents spam
- [x] Works with all major screen readers
- [x] Integrated with toast notifications
- [x] Form validation announcements
- [x] Loading state announcements
- [x] Route change announcements

---

## Troubleshooting

### Announcements Not Working

1. **Check Provider**: Ensure `AnnouncementProvider` wraps your app
2. **Verify Screen Reader**: Make sure screen reader is running
3. **Check Verbosity**: Some screen readers have different verbosity levels
4. **Test Message**: Try a simple message first to verify setup

### Announcements Repeating

1. **Check Debounce**: Increase `debounceMs` value
2. **Remove Duplicates**: Ensure you're not calling `announce` multiple times
3. **Clear Previous**: Use `clearAfter` to auto-clear old announcements

### Announcements Too Fast

1. **Increase Debounce**: Set higher `debounceMs`
2. **Use Queue**: Let `AnnouncementProvider` handle queuing
3. **Reduce Frequency**: Only announce important changes

### Screen Reader Ignoring Announcements

1. **Check Role**: Ensure `role="status"` or `role="alert"` is present
2. **Check aria-live**: Verify `aria-live` attribute is set
3. **Check Visibility**: Ensure element isn't `display: none`
4. **Check Timing**: Some screen readers need brief delay

---

## Related Documentation

- [Keyboard Navigation](./KEYBOARD_NAVIGATION.md)
- [ARIA Labels](./ARIA_LABELS.md)
- [Accessibility Testing](./ACCESSIBILITY_TESTING.md)
- [Component Documentation](./COMPONENTS.md)

---

## Resources

### Official Documentation
- [ARIA Live Regions - MDN](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)

### Screen Readers
- [NVDA (Free, Windows)](https://www.nvaccess.org/)
- [JAWS (Paid, Windows)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (Built-in, macOS/iOS)](https://www.apple.com/accessibility/voiceover/)
- [TalkBack (Built-in, Android)](https://support.google.com/accessibility/android/answer/6283677)

### Testing Tools
- [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)

---

## Contributing

When adding screen reader announcements:

1. **Determine Politeness**: Choose `polite` or `assertive` based on urgency
2. **Write Clear Messages**: Be specific and actionable
3. **Test with Screen Readers**: Verify with at least one screen reader
4. **Document Usage**: Update this guide with examples
5. **Add Tests**: Include automated tests for announcements

---

## License

MIT License - See [LICENSE](../LICENSE) file for details
