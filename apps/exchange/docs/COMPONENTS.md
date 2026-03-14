# Component Library Documentation

Complete reference guide for all reusable components in the DCC Wallet React application.

## Table of Contents

1. [Atomic Components](#atomic-components)
   - [Button](#button)
   - [Input](#input)
   - [Select](#select)
   - [Checkbox](#checkbox)
   - [Badge](#badge)
   - [Avatar](#avatar)
   - [Spinner](#spinner)
   - [Divider](#divider)
   - [Tooltip](#tooltip)
   - [Card](#card)
   - [Icon](#icon)
2. [Layout Components](#layout-components)
   - [Box](#box)
   - [Stack](#stack)
   - [Grid](#grid)
3. [Form Components](#form-components)
   - [FormInput](#forminput)
   - [FormSelect](#formselect)
   - [ValidationError](#validationerror)
4. [Modal Components](#modal-components)
   - [Modal](#modal)
   - [ConfirmDialog](#confirmdialog)
   - [AlertModal](#alertmodal)
5. [Performance Components](#performance-components)
   - [VirtualList](#virtuallist)
   - [LazyImage](#lazyimage)
6. [Utility Components](#utility-components)
   - [ErrorBoundary](#errorboundary)
   - [Portal](#portal)
   - [ProtectedRoute](#protectedroute)

---

## Atomic Components

### Button

Reusable button component with variants, sizes, and loading states. Replaces Angular `w-button` directive.

#### Import

```tsx
import { Button } from '@/components/atoms/Button';
```

#### Props

```tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'text' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

#### Usage Examples

**Basic Button**
```tsx
<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>
```

**Button with Icons**
```tsx
import { FiSend } from 'react-icons/fi';

<Button 
  variant="primary" 
  leftIcon={<FiSend />}
  onClick={handleSend}
>
  Send Transaction
</Button>
```

**Loading State**
```tsx
<Button 
  variant="primary" 
  isLoading={isSubmitting}
  loadingText="Processing..."
  disabled={isSubmitting}
>
  Submit
</Button>
```

**Full Width**
```tsx
<Button variant="success" fullWidth>
  Confirm Transfer
</Button>
```

**Sizes**
```tsx
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
<Button size="large">Large</Button>
```

---

### Input

Styled input component with label, error states, and validation feedback. Replaces Angular `w-input` directive.

#### Import

```tsx
import { Input } from '@/components/atoms/Input';
```

#### Props

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  inputSize?: 'small' | 'medium' | 'large';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

#### Usage Examples

**Basic Input**
```tsx
<Input
  type="text"
  label="Wallet Address"
  placeholder="Enter address"
  value={address}
  onChange={(e) => setAddress(e.target.value)}
/>
```

**With Validation Error**
```tsx
<Input
  type="text"
  label="Amount"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  error="Insufficient balance"
  helperText="Enter amount in DCC"
/>
```

**With Icons**
```tsx
import { FiSearch } from 'react-icons/fi';

<Input
  type="search"
  placeholder="Search assets..."
  leftIcon={<FiSearch />}
  value={search}
  onChange={(e) => setSearch(e.target.value)}
/>
```

---

### Select

Dropdown select component with custom styling and options support. Replaces Angular `w-select` directive.

#### Import

```tsx
import { Select } from '@/components/atoms/Select';
```

#### Props

```tsx
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  selectSize?: 'small' | 'medium' | 'large';
  options: SelectOption[];
  placeholder?: string;
}
```

#### Usage Examples

**Basic Select**
```tsx
const assetOptions = [
  { value: 'DCC', label: 'DecentralChain' },
  { value: 'BTC', label: 'Bitcoin' },
  { value: 'ETH', label: 'Ethereum' },
];

<Select
  label="Select Asset"
  options={assetOptions}
  value={selectedAsset}
  onChange={(e) => setSelectedAsset(e.target.value)}
/>
```

**With Placeholder**
```tsx
<Select
  label="Network"
  placeholder="Choose network..."
  options={networkOptions}
  value={network}
  onChange={(e) => setNetwork(e.target.value)}
  fullWidth
/>
```

---

### Checkbox

Styled checkbox component with label and checked state. Replaces Angular `w-checkbox` directive.

#### Import

```tsx
import { Checkbox } from '@/components/atoms/Checkbox';
```

#### Props

```tsx
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
```

#### Usage Examples

**Basic Checkbox**
```tsx
<Checkbox
  label="I agree to the terms and conditions"
  checked={agreedToTerms}
  onChange={(e) => setAgreedToTerms(e.target.checked)}
/>
```

**Multiple Checkboxes**
```tsx
<Checkbox
  label="Enable notifications"
  checked={notifications}
  onChange={(e) => setNotifications(e.target.checked)}
/>
<Checkbox
  label="Enable auto-update"
  checked={autoUpdate}
  onChange={(e) => setAutoUpdate(e.target.checked)}
/>
```

---

### Badge

Badge component for notification counts and status indicators with multiple color variants.

#### Import

```tsx
import { Badge } from '@/components/atoms/Badge';
```

#### Props

```tsx
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'small' | 'medium' | 'large';
  pill?: boolean;
  dot?: boolean;
  className?: string;
}
```

#### Usage Examples

**Status Badge**
```tsx
<Badge variant="success">Active</Badge>
<Badge variant="danger">Failed</Badge>
<Badge variant="warning">Pending</Badge>
```

**Notification Count**
```tsx
<Badge variant="primary" pill>5</Badge>
```

**Dot Badge**
```tsx
<Badge variant="info" dot>New</Badge>
```

---

### Avatar

Avatar component for user profile images with fallback initials.

#### Import

```tsx
import { Avatar } from '@/components/atoms/Avatar';
```

#### Props

```tsx
interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}
```

#### Usage Examples

**With Image**
```tsx
<Avatar src="/path/to/avatar.jpg" name="John Doe" />
```

**With Initials Fallback**
```tsx
<Avatar name="John Doe" size="large" />
```

---

### Spinner

Animated loading spinner component with customizable size and color.

#### Import

```tsx
import { Spinner } from '@/components/atoms/Spinner';
```

#### Props

```tsx
interface SpinnerProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  color?: string;
  className?: string;
}
```

#### Usage Examples

**Basic Spinner**
```tsx
<Spinner />
```

**Custom Size and Color**
```tsx
<Spinner size="large" color="#0066cc" />
```

**Centered Loading**
```tsx
<div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
  <Spinner size="xlarge" />
</div>
```

---

### Divider

Horizontal/vertical divider component for visual separation.

#### Import

```tsx
import { Divider } from '@/components/atoms/Divider';
```

#### Props

```tsx
interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  spacing?: string;
  className?: string;
}
```

#### Usage Examples

**Horizontal Divider**
```tsx
<Divider />
```

**Vertical Divider**
```tsx
<div style={{ display: 'flex', height: '100px' }}>
  <span>Left Content</span>
  <Divider orientation="vertical" spacing="1rem" />
  <span>Right Content</span>
</div>
```

---

### Tooltip

Tooltip component that shows contextual information on hover.

#### Import

```tsx
import { Tooltip } from '@/components/atoms/Tooltip';
```

#### Props

```tsx
interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}
```

#### Usage Examples

**Basic Tooltip**
```tsx
<Tooltip content="Copy to clipboard" position="top">
  <Button variant="text">Copy</Button>
</Tooltip>
```

**Complex Content**
```tsx
<Tooltip 
  content={
    <div>
      <strong>Fee Information</strong>
      <p>Network fee: 0.001 DCC</p>
    </div>
  }
  position="right"
  delay={300}
>
  <Icon name="info" />
</Tooltip>
```

---

### Card

Card component with elevation (shadows) and padding for content containers.

#### Import

```tsx
import { Card } from '@/components/atoms/Card';
```

#### Props

```tsx
interface CardProps {
  children: React.ReactNode;
  elevation?: 'none' | 'sm' | 'md' | 'lg';
  padding?: string;
  onClick?: () => void;
  className?: string;
}
```

#### Usage Examples

**Basic Card**
```tsx
<Card elevation="md" padding="2rem">
  <h3>Total Balance</h3>
  <p>1,234.56 DCC</p>
</Card>
```

**Clickable Card**
```tsx
<Card 
  elevation="sm" 
  onClick={() => navigate('/asset/DCC')}
  style={{ cursor: 'pointer' }}
>
  <h4>DecentralChain</h4>
  <p>Balance: 1,000 DCC</p>
</Card>
```

---

### Icon

Icon component system using react-icons library with support for Material Design, Feather, and custom icons.

#### Import

```tsx
import { Icon } from '@/components/atoms/Icon';
```

#### Props

```tsx
interface IconProps {
  name: IconName;
  size?: number | string;
  color?: string;
  className?: string;
  onClick?: () => void;
}
```

#### Usage Examples

**Material Design Icons**
```tsx
import { MdAccountBalanceWallet } from 'react-icons/md';

<Icon name={MdAccountBalanceWallet} size={24} color="#0066cc" />
```

**Feather Icons**
```tsx
import { FiSend, FiDownload } from 'react-icons/fi';

<Icon name={FiSend} size="20px" />
<Icon name={FiDownload} size={18} />
```

---

## Layout Components

### Box

Universal layout primitive with spacing, sizing, and positioning props.

#### Import

```tsx
import { Box } from '@/components/atoms/Box';
```

#### Props

```tsx
interface BoxProps {
  children?: React.ReactNode;
  padding?: string;
  margin?: string;
  width?: string | number;
  height?: string | number;
  display?: CSSProperties['display'];
  flexDirection?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  justifyContent?: CSSProperties['justifyContent'];
  gap?: string;
  background?: string;
  border?: string;
  borderRadius?: string;
  className?: string;
}
```

#### Usage Examples

**Flex Container**
```tsx
<Box 
  display="flex" 
  alignItems="center" 
  justifyContent="space-between"
  padding="1rem"
>
  <span>Left</span>
  <span>Right</span>
</Box>
```

**Spacing and Sizing**
```tsx
<Box 
  width="100%" 
  maxWidth="600px" 
  margin="0 auto"
  padding="2rem"
  background="#f5f5f5"
  borderRadius="8px"
>
  <p>Content</p>
</Box>
```

---

### Stack

Layout component for vertical or horizontal stacking with consistent spacing.

#### Import

```tsx
import { Stack } from '@/components/atoms/Stack';
```

#### Props

```tsx
interface StackProps {
  children: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  spacing?: string;
  align?: CSSProperties['alignItems'];
  justify?: CSSProperties['justifyContent'];
  wrap?: boolean;
  className?: string;
}
```

#### Usage Examples

**Vertical Stack**
```tsx
<Stack direction="vertical" spacing="1rem">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
</Stack>
```

**Horizontal Stack**
```tsx
<Stack direction="horizontal" spacing="0.5rem" align="center">
  <Button variant="primary">Save</Button>
  <Button variant="secondary">Cancel</Button>
</Stack>
```

---

### Grid

CSS Grid layout component with responsive columns.

#### Import

```tsx
import { Grid } from '@/components/atoms/Grid';
```

#### Props

```tsx
interface GridProps {
  children: React.ReactNode;
  columns?: number | string;
  gap?: string;
  rowGap?: string;
  columnGap?: string;
  autoFlow?: CSSProperties['gridAutoFlow'];
  className?: string;
}
```

#### Usage Examples

**Responsive Grid**
```tsx
<Grid columns="repeat(auto-fit, minmax(250px, 1fr))" gap="1.5rem">
  <Card>Item 1</Card>
  <Card>Item 2</Card>
  <Card>Item 3</Card>
  <Card>Item 4</Card>
</Grid>
```

**Fixed Columns**
```tsx
<Grid columns={3} gap="2rem">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</Grid>
```

---

## Form Components

### FormInput

Controlled input component integrated with react-hook-form for validation.

#### Import

```tsx
import { FormInput } from '@/components/forms/FormInput';
```

#### Props

```tsx
interface FormInputProps extends InputProps {
  name: string;
  control: Control<any>;
  rules?: RegisterOptions;
}
```

#### Usage Examples

**With React Hook Form**
```tsx
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/forms/FormInput';

function MyForm() {
  const { control, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormInput
        name="address"
        control={control}
        label="Recipient Address"
        rules={{
          required: 'Address is required',
          pattern: {
            value: /^3[a-zA-Z0-9]{34}$/,
            message: 'Invalid address format'
          }
        }}
      />
    </form>
  );
}
```

---

### FormSelect

Select component integrated with react-hook-form for validation.

#### Import

```tsx
import { FormSelect } from '@/components/forms/FormSelect';
```

#### Props

```tsx
interface FormSelectProps extends SelectProps {
  name: string;
  control: Control<any>;
  rules?: RegisterOptions;
}
```

#### Usage Examples

**With React Hook Form**
```tsx
<FormSelect
  name="assetId"
  control={control}
  label="Asset"
  options={assetOptions}
  rules={{ required: 'Please select an asset' }}
/>
```

---

### ValidationError

Component to display validation errors consistently.

#### Import

```tsx
import { ValidationError } from '@/components/forms/ValidationError';
```

#### Props

```tsx
interface ValidationErrorProps {
  errors: FieldErrors;
  name: string;
}
```

#### Usage Examples

**Display Field Error**
```tsx
import { useForm } from 'react-hook-form';

function MyForm() {
  const { register, formState: { errors } } = useForm();

  return (
    <>
      <Input {...register('email', { required: 'Email is required' })} />
      <ValidationError errors={errors} name="email" />
    </>
  );
}
```

---

## Modal Components

### Modal

Reusable modal component with overlay, animations, and accessibility features.

#### Import

```tsx
import { Modal } from '@/components/modals/Modal';
```

#### Props

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  trapFocus?: boolean;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  className?: string;
}
```

#### Usage Examples

**Basic Modal**
```tsx
const [isOpen, setIsOpen] = useState(false);

<>
  <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
  
  <Modal
    open={isOpen}
    onClose={() => setIsOpen(false)}
    title="Confirm Transaction"
  >
    <p>Are you sure you want to proceed?</p>
    <Stack direction="horizontal" spacing="1rem">
      <Button onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
    </Stack>
  </Modal>
</>
```

**Large Modal with Custom Content**
```tsx
<Modal
  open={showDetails}
  onClose={() => setShowDetails(false)}
  size="large"
  title="Transaction Details"
  closeOnOverlayClick={false}
>
  <TransactionDetails data={txData} />
</Modal>
```

---

### ConfirmDialog

Reusable confirmation dialog for destructive actions.

#### Import

```tsx
import { ConfirmDialog } from '@/components/modals/ConfirmDialog';
```

#### Props

```tsx
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}
```

#### Usage Examples

**Delete Confirmation**
```tsx
<ConfirmDialog
  open={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Account?"
  message="This action cannot be undone. All your data will be permanently deleted."
  confirmText="Delete"
  cancelText="Cancel"
  variant="danger"
/>
```

---

### AlertModal

Alert modal for displaying important notifications to users.

#### Import

```tsx
import { AlertModal } from '@/components/modals/AlertModal';
```

#### Props

```tsx
interface AlertModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  okText?: string;
}
```

#### Usage Examples

**Success Alert**
```tsx
<AlertModal
  open={showSuccess}
  onClose={() => setShowSuccess(false)}
  title="Transaction Successful"
  message="Your transaction has been broadcast to the network."
  variant="success"
/>
```

**Error Alert**
```tsx
<AlertModal
  open={showError}
  onClose={() => setShowError(false)}
  title="Transaction Failed"
  message={errorMessage}
  variant="error"
/>
```

---

## Performance Components

### VirtualList

Virtual scrolling component for large lists with optimized rendering (zero dependencies).

#### Import

```tsx
import { VirtualList } from '@/components/VirtualList';
```

#### Props

```tsx
interface VirtualListItem {
  id: string | number;
  [key: string]: any;
}

interface VirtualListProps<T extends VirtualListItem> {
  items: T[];
  height: number | string;
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  onScroll?: (scrollTop: number) => void;
}
```

#### Usage Examples

**Transaction List**
```tsx
<VirtualList
  items={transactions}
  height={600}
  itemHeight={80}
  renderItem={(tx, index) => (
    <TransactionCard key={tx.id} transaction={tx} />
  )}
  overscan={5}
  emptyMessage="No transactions found"
/>
```

**Asset List**
```tsx
const renderAsset = (asset: Asset, index: number) => (
  <Card key={asset.id} padding="1rem">
    <h4>{asset.name}</h4>
    <p>Balance: {asset.balance}</p>
  </Card>
);

<VirtualList
  items={assets}
  height="100vh"
  itemHeight={100}
  renderItem={renderAsset}
  onScroll={(scrollTop) => console.log('Scrolled to:', scrollTop)}
/>
```

---

### LazyImage

Lazy loading image component with intersection observer and placeholder support.

#### Import

```tsx
import { LazyImage } from '@/components/LazyImage';
```

#### Props

```tsx
interface LazyImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  width?: number | string;
  height?: number | string;
  objectFit?: CSSProperties['objectFit'];
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  threshold?: number;
  rootMargin?: string;
}
```

#### Usage Examples

**Basic Lazy Image**
```tsx
<LazyImage
  src="/assets/logo.png"
  alt="DecentralChain Logo"
  width={200}
  height={200}
/>
```

**With Placeholder**
```tsx
<LazyImage
  src={assetImage}
  alt={assetName}
  placeholder="/assets/placeholder.png"
  objectFit="contain"
  onLoad={() => console.log('Image loaded')}
  onError={(error) => console.error('Failed to load:', error)}
/>
```

**Custom Loading Threshold**
```tsx
<LazyImage
  src={largeImage}
  alt="Asset chart"
  threshold={0.5}
  rootMargin="200px"
/>
```

---

## Utility Components

### ErrorBoundary

React Error Boundary to catch and display component errors gracefully.

#### Import

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
```

#### Props

```tsx
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, resetError: () => void) => ReactNode;
}
```

#### Usage Examples

**Wrap Application**
```tsx
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes />
      </Router>
    </ErrorBoundary>
  );
}
```

**Custom Fallback UI**
```tsx
<ErrorBoundary
  fallback={(error, resetError) => (
    <div>
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <Button onClick={resetError}>Try Again</Button>
    </div>
  )}
>
  <MyComponent />
</ErrorBoundary>
```

---

### Portal

Portal component for rendering children outside the DOM hierarchy.

#### Import

```tsx
import { Portal } from '@/components/atoms/Portal';
```

#### Usage Examples

**Render Modal to Body**
```tsx
<Portal>
  <div className="modal-overlay">
    <div className="modal-content">
      {children}
    </div>
  </div>
</Portal>
```

---

### ProtectedRoute

Route component that redirects unauthenticated users to the welcome page.

#### Import

```tsx
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
```

#### Usage Examples

**Protect Wallet Routes**
```tsx
import { Routes, Route } from 'react-router-dom';

<Routes>
  <Route path="/welcome" element={<WelcomePage />} />
  
  <Route element={<ProtectedRoute />}>
    <Route path="/wallet" element={<WalletPage />} />
    <Route path="/dex" element={<DexPage />} />
    <Route path="/settings" element={<SettingsPage />} />
  </Route>
</Routes>
```

---

## Best Practices

### Component Usage Guidelines

1. **Type Safety**: Always provide TypeScript types for props
2. **Error Handling**: Use ErrorBoundary to wrap features
3. **Performance**: Use VirtualList for lists with 100+ items
4. **Accessibility**: Include proper ARIA labels and keyboard navigation
5. **Responsive Design**: Use Box, Stack, and Grid for layouts
6. **Form Validation**: Use FormInput/FormSelect with react-hook-form
7. **Loading States**: Always show Spinner or loading states
8. **Error States**: Display clear error messages with ValidationError

### Styling Patterns

```tsx
// ✅ Good: Use styled-components with theme
const StyledCard = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.background};
`;

// ❌ Bad: Avoid inline styles for complex styling
<div style={{ padding: '20px', background: '#fff' }}>
```

### Performance Tips

```tsx
// ✅ Good: Use VirtualList for large lists
<VirtualList items={1000Items} itemHeight={60} />

// ❌ Bad: Render all items
{1000Items.map(item => <ItemCard />)}

// ✅ Good: Lazy load images
<LazyImage src={largeImage} />

// ❌ Bad: Load all images immediately
<img src={largeImage} />
```

---

## Component Composition Examples

### Form with Validation

```tsx
import { useForm } from 'react-hook-form';
import { FormInput, FormSelect, Button, Stack } from '@/components';

function SendAssetForm() {
  const { control, handleSubmit } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack direction="vertical" spacing="1.5rem">
        <FormSelect
          name="assetId"
          control={control}
          label="Asset"
          options={assetOptions}
          rules={{ required: 'Asset is required' }}
        />
        
        <FormInput
          name="recipient"
          control={control}
          label="Recipient Address"
          rules={{
            required: 'Address is required',
            pattern: {
              value: /^3[a-zA-Z0-9]{34}$/,
              message: 'Invalid address format'
            }
          }}
        />
        
        <FormInput
          name="amount"
          control={control}
          label="Amount"
          type="number"
          rules={{
            required: 'Amount is required',
            min: { value: 0.00000001, message: 'Minimum amount is 0.00000001' }
          }}
        />
        
        <Button type="submit" variant="primary" fullWidth>
          Send
        </Button>
      </Stack>
    </form>
  );
}
```

### Modal with Confirmation Flow

```tsx
import { useState } from 'react';
import { Button, ConfirmDialog, AlertModal } from '@/components';

function DeleteAccountButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleDelete = async () => {
    await deleteAccount();
    setShowConfirm(false);
    setShowSuccess(true);
  };

  return (
    <>
      <Button 
        variant="danger" 
        onClick={() => setShowConfirm(true)}
      >
        Delete Account
      </Button>
      
      <ConfirmDialog
        open={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Account?"
        message="This will permanently delete your account and all associated data."
        variant="danger"
      />
      
      <AlertModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Account Deleted"
        message="Your account has been successfully deleted."
        variant="success"
      />
    </>
  );
}
```

---

## Migration from Angular

### Directive to Component Mapping

| Angular Directive | React Component | Notes |
|------------------|-----------------|-------|
| `w-button` | `<Button>` | Variants: primary, secondary, text, danger, success |
| `w-input` | `<Input>` | Includes label, error, helper text |
| `w-select` | `<Select>` | Custom styled dropdown |
| `w-checkbox` | `<Checkbox>` | Styled checkbox with label |
| `*ngFor` | `VirtualList` or `.map()` | Use VirtualList for large lists |
| `ngIf` | `condition && <Component>` | React conditional rendering |
| `ngModel` | `react-hook-form` | Use FormInput/FormSelect |

### Example Migration

**Angular Template**
```html
<w-button 
  variant="primary" 
  [disabled]="loading"
  (click)="handleClick()">
  Submit
</w-button>

<w-input 
  label="Amount"
  [(ngModel)]="amount"
  [error]="amountError">
</w-input>
```

**React Equivalent**
```tsx
<Button 
  variant="primary" 
  disabled={loading}
  onClick={handleClick}
>
  Submit
</Button>

<Input
  label="Amount"
  value={amount}
  onChange={(e) => setAmount(e.target.value)}
  error={amountError}
/>
```

---

## Testing Components

### Unit Test Example

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/atoms/Button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText('Disabled')).toBeDisabled();
  });
});
```

---

## Additional Resources

- [React Documentation](https://react.dev/)
- [Styled Components Documentation](https://styled-components.com/)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Support

For issues or questions about components:
1. Check this documentation first
2. Review component source code in `src/components/`
3. Open an issue on GitHub with component name and reproduction steps
4. Contact the development team on Discord

---

**Last Updated**: January 2025  
**Version**: 1.0.0
