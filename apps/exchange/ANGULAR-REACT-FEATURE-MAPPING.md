# Angular to React Feature Mapping
## Comprehensive Comparison Based on Actual Code Analysis

**Last Updated:** October 17, 2025  
**Purpose:** Map all Angular modules to React pages and identify missing functionality

---

## ✅ FULLY IMPLEMENTED PAGES

### 1. **Welcome Page**
- **Angular:** `src/modules/welcome/`
- **React:** `dcc-react/src/pages/Welcome/Welcome.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Animated gradient background with floating shapes
  - Two-panel layout (branding + auth)
  - Navigation to SignUp and SignIn
  - Feature highlights (256-bit encryption, <100ms transactions, 24/7 support)
  - Responsive design with mobile adaptations
  - Material UI animations (Fade, Slide, Zoom)

### 2. **SignIn Page**
- **Angular:** `src/modules/signIn/`
- **React:** `dcc-react/src/pages/SignIn/SignIn.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Modern crypto-inspired design
  - Glassmorphism card with blur effects
  - Floating shapes and glowing orbs
  - LoginForm component integration
  - Password authentication
  - Smooth animations

### 3. **SignUp Page**
- **Angular:** `src/modules/signUp/`
- **React:** `dcc-react/src/pages/SignUp/SignUp.tsx`
- **Status:** ✅ Complete
- **Features:**
  - CreateAccount component integration
  - Animated gradient background
  - Glassmorphism content wrapper
  - Security-focused UI
  - Responsive mobile design

### 4. **Wallet Dashboard**
- **Angular:** `src/modules/wallet/`
- **React:** `dcc-react/src/pages/Wallet/Wallet.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Tab navigation (Portfolio, Transactions, Leasing)
  - Glassmorphism glass cards
  - Icon-based tabs with Material UI
  - Outlet for nested routes
  - Active tab indication
  - Smooth slide animations

### 5. **DEX Trading Interface**
- **Angular:** `src/modules/dex/`
- **React:** `dcc-react/src/pages/Dex/Dex.tsx`
- **Status:** ✅ UI Complete, Backend Partial
- **Implemented Features:**
  - Professional trading layout with grid system
  - Live price display with trending indicators
  - Order book panel
  - Trading chart panel (placeholder)
  - Buy/Sell trade forms area
  - Recent trades panel
  - Real-time price updates (simulated)
  - Volume and 24h change chips
- **Missing Backend:**
  - WebSocket integration for real prices
  - Actual order placement via matcher API
  - Real order book data
  - Trade history data fetching

### 6. **Token Management Page**
- **Angular:** `src/modules/tokens/`
- **React:** `dcc-react/src/pages/TokensPage.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Token issuance form (name, description, quantity)
  - Decimals slider (0-8)
  - Reissuable toggle
  - Smart asset script support
  - NFT mode detection (quantity=1, decimals=0)
  - Token preview with avatar
  - Terms agreement checkbox
  - Fee display
  - Form validation

### 7. **Import Hub Page**
- **Angular:** `src/modules/import/`
- **React:** `dcc-react/src/pages/ImportPage.tsx`
- **Status:** ✅ Complete
- **Features:**
  - Hub for all import methods
  - 4 import options (Seed, Backup File, Ledger, Keeper)
  - Grid layout with hover effects
  - Icon-based method cards
  - Navigation to specific import flows
  - Create account link

---

## 🔄 PARTIALLY IMPLEMENTED PAGES

### 8. **Seed Backup/Save Page**
- **Angular:** `src/modules/saveSeed/`
- **React:** `dcc-react/src/pages/SaveSeed/SaveSeedPage.tsx` ⭐ **JUST CREATED**
- **Status:** 🆕 Newly Implemented
- **Features Implemented:**
  - User account selection dropdown
  - Password authentication for seed access
  - Integration with data-service API (matching Angular)
  - Error handling (network errors, wrong password)
  - Two views: account list and seed display
  - SeedBackup component integration
  - Material UI styled with animations
- **Backend Integration:** Uses `data-service/signature.getDefaultSignatureApi()` exactly like Angular

### 9. **Backup Restore Page**
- **Angular:** `src/modules/fromBackup/` + `src/modules/restore/`
- **React:** `dcc-react/src/pages/RestoreFromBackupPage.tsx`
- **Status:** ⚠️ Skeleton Only
- **Missing Features:**
  - File upload dropzone
  - Backup file validation (JSON schema)
  - Decrypt encrypted backups
  - Password input for encrypted files
  - Import account data to storage
  - Progress indicator during restore
  - Backup file download/export feature in Settings

### 10. **Account Switching**
- **Angular:** `src/modules/switch/`
- **React:** `dcc-react/src/pages/SwitchAccountPage.tsx`
- **Status:** ⚠️ Skeleton Only
- **Missing Features:**
  - List all accounts with avatars
  - Show account balances
  - Account type indicators (seed/keeper/ledger icons)
  - Quick switch without password (if unlocked)
  - Password prompt if locked
  - Integration with AuthContext

### 11. **Account Migration**
- **Angular:** `src/modules/migrate/`
- **React:** `dcc-react/src/pages/MigratePage.tsx`
- **Status:** ⚠️ Skeleton Only
- **Missing Features:**
  - Legacy wallet format detection
  - Parse old storage structure
  - Convert to new format
  - Migrate transaction history
  - Progress bar during migration
  - Backup old data before migration

---

## 🔴 NOT IMPLEMENTED / SKELETON PAGES

### 12. **Keeper Import**
- **Angular:** `src/modules/keeper/`
- **React:** `dcc-react/src/pages/KeeperImportPage.tsx`
- **Status:** ❌ Skeleton
- **Required Features:**
  - Detect Waves Keeper extension
  - Request Keeper connection
  - Permission request handling
  - Store Keeper account as external type
  - Keeper API integration for signing

### 13. **Ledger Import**
- **Angular:** `src/modules/ledger/`
- **React:** `dcc-react/src/pages/LedgerImportPage.tsx`
- **Status:** ❌ Skeleton
- **Required Features:**
  - Detect Ledger device (USB HID)
  - Use `@ledgerhq/hw-app-waves` library
  - Derivation path selector (default: `m/44'/5741564'/0'/0'/0'`)
  - Get public key from Ledger
  - Generate address
  - Transaction signing via Ledger

### 14. **Desktop Page**
- **Angular:** `src/modules/desktop/`
- **React:** `dcc-react/src/pages/DesktopPage.tsx`
- **Status:** ❌ Skeleton
- **Required Features:**
  - Desktop welcome screen (Electron only)
  - Quick actions dashboard
  - Recent activity widget
  - Network status indicator
  - Keyboard shortcut reference

### 15. **Desktop Update Page**
- **Angular:** `src/modules/desktopUpdate/`
- **React:** `dcc-react/src/pages/DesktopUpdatePage.tsx`
- **Status:** ❌ Skeleton
- **Required Features:**
  - Auto-update check on startup
  - Download progress bar
  - Release notes display
  - Install & restart button
  - Electron autoUpdater API integration

### 16. **DEX Demo/Tutorial**
- **Angular:** `src/modules/dex/` (demo mode)
- **React:** `dcc-react/src/pages/DexDemoPage.tsx`
- **Status:** ❌ Skeleton
- **Required Features:**
  - Interactive tutorial overlay
  - Step-by-step trading guide
  - Simulated order placement
  - Mock market data
  - Educational tooltips

### 17. **Stand/Kiosk Mode**
- **Angular:** `src/modules/stand/`
- **React:** `dcc-react/src/pages/StandPage.tsx`
- **Status:** ❌ Skeleton
- **Required Features:**
  - Public display mode (read-only)
  - Large QR code for address
  - Hide sensitive info
  - Auto-lock timer
  - Fullscreen mode

### 18. **Unavailable/Maintenance Page**
- **Angular:** `src/modules/unavailable/`
- **React:** `dcc-react/src/pages/UnavailablePage.tsx`
- **Status:** ❌ Skeleton
- **Required Features:**
  - Service status checker
  - Maintenance mode display
  - Alternative node suggestions
  - Support contact link

---

## 📦 FEATURE MODULES STATUS

### **Wallet Features** (`dcc-react/src/features/wallet/`)

#### ✅ Implemented:
- **Portfolio.tsx** - Asset grid display, total balance
- **AssetList.tsx** - List view of assets
- **AssetCard.tsx** - Individual asset card
- **Transactions.tsx** - Transaction history table
- **Leasing.tsx** - Lease WAVES functionality
- **SendAssetModal.tsx** - Send asset form with validation
- **ReceiveAssetModal.tsx** - Receive address QR code
- **WalletActions.tsx** - Common wallet actions

#### ⚠️ Missing:
- Asset details page route (`/desktop/wallet/assets/:assetId`)
- Transaction filtering (type, date range, search)
- Transaction export to CSV
- Advanced leasing (cancel, history, node stats)
- Bulk operations

### **DEX Features** (`dcc-react/src/features/dex/`)

#### ✅ Implemented:
- **TradingPairSelector.tsx** - Pair selection dropdown
- **SellOrderForm.tsx** - Sell order form UI
- **OrderBook.tsx** - Order book component
- **TradingViewChart.tsx** - Chart wrapper
- **TradeHistory.tsx** - Trade history display
- **UserOrders.tsx** - User's active orders
- **useDexWebSocket.ts** - WebSocket hook
- **useMarketData.ts** - Market data hook

#### ⚠️ Missing Backend Integration:
- BuyOrderForm.tsx (create this)
- Complete order placement logic
- Real-time WebSocket data binding
- Price calculation engine
- Order validation (min/max checks)
- Fee calculation
- Matcher API integration
- Order cancellation
- Filled percentage tracking

### **Auth Features** (`dcc-react/src/features/auth/`)

#### ✅ Implemented:
- **CreateAccount.tsx** - Account creation flow
- **LoginForm.tsx** - Password authentication
- **SeedBackup.tsx** - Seed phrase display/backup
- **ImportAccount.tsx** - Seed phrase import
- **AccountSwitcher.tsx** - Switch between accounts
- **PasswordProtection.tsx** - Password input component

#### ⚠️ Needs Enhancement:
- Multi-account management
- Session management
- Hardware wallet integration
- Keeper extension integration

### **Assets Features** (`dcc-react/src/features/assets/`)

#### ✅ Implemented:
- **IssueTokenForm.tsx** - Token issuance
- **ReissueTokenForm.tsx** - Token reissuance
- **BurnTokenForm.tsx** - Token burning
- **AssetInfo.tsx** - Asset information display

#### ✅ Complete - Matches Angular

### **Settings Features** (`dcc-react/src/features/settings/`)

#### ✅ Implemented:
- **SettingsPage.tsx** - Main settings container
- **LanguageSettings.tsx** - Language selection
- **ThemeSettings.tsx** - Dark/light mode
- **NetworkSettings.tsx** - Network configuration

#### ⚠️ Missing:
- Advanced preferences
- Backup/export settings
- Security settings (2FA, session timeout)
- Address book management
- Custom API endpoints

### **Advanced Features** (`dcc-react/src/features/advanced/`)

#### ✅ Implemented:
- **AliasForm.tsx** - Create address alias
- **DataTransactionForm.tsx** - Post data to blockchain
- **SetScriptForm.tsx** - Set account script
- **MassTransferForm.tsx** - Bulk transfers

#### ✅ Complete - Matches Angular

---

## 🎯 CRITICAL MISSING MODULES (Not in React)

### 1. **Sessions Module**
- **Angular:** `src/modules/sessions/`
- **React:** ❌ Does not exist
- **Required Implementation:**
  - Multi-tab session synchronization (BroadcastChannel API)
  - Session timeout (15min inactivity)
  - Active session indicator in header
  - Lock/unlock functionality
  - Session state in localStorage

**Recommended Location:** `dcc-react/src/features/sessions/SessionManager.tsx`

---

## 📊 FUNCTIONALITY COMPARISON MATRIX

| Module | Angular Path | React Path | Status | Completion % | Priority |
|--------|-------------|------------|--------|--------------|----------|
| Welcome | modules/welcome | pages/Welcome | ✅ Complete | 100% | ✅ |
| SignIn | modules/signIn | pages/SignIn | ✅ Complete | 100% | ✅ |
| SignUp | modules/signUp | pages/SignUp | ✅ Complete | 100% | ✅ |
| Wallet | modules/wallet | pages/Wallet + features/wallet | ✅ Complete | 95% | 🟡 |
| DEX | modules/dex | pages/Dex + features/dex | ⚠️ Partial | 70% | 🔴 |
| Tokens | modules/tokens | pages/TokensPage | ✅ Complete | 100% | ✅ |
| Import | modules/import | pages/ImportPage | ✅ Complete | 100% | ✅ |
| SaveSeed | modules/saveSeed | pages/SaveSeed | 🆕 New | 95% | ✅ |
| FromBackup | modules/fromBackup | pages/RestoreFromBackupPage | ❌ Skeleton | 10% | 🔴 |
| Restore | modules/restore | pages/RestoreFromBackupPage | ❌ Skeleton | 10% | 🔴 |
| Keeper | modules/keeper | pages/KeeperImportPage | ❌ Skeleton | 5% | 🟡 |
| Ledger | modules/ledger | pages/LedgerImportPage | ❌ Skeleton | 5% | 🟡 |
| Migrate | modules/migrate | pages/MigratePage | ❌ Skeleton | 10% | 🟡 |
| Switch | modules/switch | pages/SwitchAccountPage | ❌ Skeleton | 5% | 🔴 |
| Sessions | modules/sessions | ❌ Missing | ❌ None | 0% | 🔴 |
| Desktop | modules/desktop | pages/DesktopPage | ❌ Skeleton | 5% | 🟡 |
| DesktopUpdate | modules/desktopUpdate | pages/DesktopUpdatePage | ❌ Skeleton | 5% | 🟡 |
| Stand | modules/stand | pages/StandPage | ❌ Skeleton | 5% | 🔵 |
| Unavailable | modules/unavailable | pages/UnavailablePage | ❌ Skeleton | 10% | 🔵 |
| Settings | modules/app/sections | features/settings | ✅ Complete | 90% | 🟡 |

**Legend:**
- 🔴 High Priority - Core functionality
- 🟡 Medium Priority - Important features
- 🔵 Low Priority - Nice-to-have features

---

## 🔧 DETAILED IMPLEMENTATION NEEDS

### **HIGH PRIORITY (Must Have for Feature Parity)**

#### 1. **Sessions Management System**
**Missing Entirely** - Critical for multi-account/multi-tab support

**Implementation Plan:**
```typescript
// dcc-react/src/features/sessions/SessionManager.tsx
- Create SessionContext with:
  - activeSession: Session | null
  - sessions: Session[]
  - sessionTimeout: 15 minutes
  - createSession(user)
  - switchSession(sessionId)
  - lockSession()
  - unlockSession()
  - refreshActivity()

// dcc-react/src/features/sessions/SessionSynchronizer.tsx  
- BroadcastChannel for cross-tab sync
- Listen for: 'session-created', 'session-locked', 'session-switched'
- Update local session state on broadcasts

// Integration Points:
- Header.tsx: Add session lock/unlock button
- AuthContext.tsx: Integrate session management
- App.tsx: Add activity monitoring (mousemove, keypress)
```

**Angular Reference:**
```javascript
// src/modules/sessions/controllers/SessionsCtrl.js
- Manages multiple user sessions
- Handles session timeouts
- Cross-window synchronization
```

#### 2. **Account Switching (Complete Implementation)**
**Current:** Skeleton only

**Required Implementation:**
```typescript
// dcc-react/src/pages/SwitchAccountPage.tsx - Complete rewrite needed
- List all stored accounts
- Display account type badges (Seed/Ledger/Keeper)
- Show account balances (fetch from API)
- Password required if session locked
- Quick switch if unlocked
- Account avatar generation (first letter + gradient)
```

**Angular Reference:** `src/modules/switch/controllers/SwitchAccountCtrl.js`
- Uses `user.getFilteredUserList()`
- Validates password before switch
- Updates active session

#### 3. **Backup & Restore Flow**
**Current:** Skeleton only

**Required Implementation:**

**Backup Creation (Add to Settings):**
```typescript
// dcc-react/src/features/settings/BackupSettings.tsx (NEW)
- Export button
- Encrypt wallet data using same crypto as Angular
- Include: seed (encrypted), accounts, settings, custom data
- Filename: dcc-wallet-backup-{timestamp}.json
- Use crypto.subtle.encrypt() with password-derived key
```

**Restore Process:**
```typescript
// dcc-react/src/pages/RestoreFromBackupPage.tsx - Complete
- File dropzone (drag & drop or click)
- Password input
- Validate JSON structure
- Decrypt using password
- Verify checksum
- Import accounts to storage
- Show progress stepper (Material UI)
```

**Backend Integration:**
```typescript
// Must match Angular's backup format exactly:
{
  "version": "3.0",
  "encrypted": true,
  "data": {
    "accounts": [...],
    "settings": {...},
    "checksum": "..."
  }
}
```

#### 4. **DEX Backend Integration**
**Current:** UI complete, backend missing

**Required Implementation:**

**BuyOrderForm:**
```typescript
// dcc-react/src/features/dex/BuyOrderForm.tsx (NEW)
- Mirror SellOrderForm structure
- Price/amount inputs
- Calculate total with fees
- Balance validation
- Submit to matcher via data-service API
```

**Real-time Features:**
```typescript
// Complete WebSocket integration in:
- OrderBook.tsx: Real order book data
- TradeHistory.tsx: Live trade feed
- TradingViewChart.tsx: Actual candlestick data
- UserOrders.tsx: Active order management

// Backend Calls:
- data-service/api/matcher/createOrder
- data-service/api/matcher/cancelOrder
- WebSocket: wss://matcher.decentralchain.io/ws
```

---

### **MEDIUM PRIORITY**

#### 5. **Ledger Hardware Wallet**
**Current:** Skeleton only

**Required Dependencies:**
```bash
npm install @ledgerhq/hw-app-waves @ledgerhq/hw-transport-webusb
```

**Implementation:**
```typescript
// dcc-react/src/pages/LedgerImportPage.tsx
- Device detection UI
- Connection status indicator
- Derivation path input (default M/44'/5741564'/0'/0'/0')
- Address derivation from public key
- Sign transactions via Ledger

// dcc-react/src/services/ledger/ledgerService.ts (NEW)
- transport.create()
- app.getAddress(path)
- app.signTransaction(txBytes)
```

#### 6. **Keeper Extension Integration**
**Current:** Skeleton only

**Implementation:**
```typescript
// dcc-react/src/pages/KeeperImportPage.tsx
- Check if Keeper extension installed: window.WavesKeeper
- Request connection: WavesKeeper.publicState()
- Get account: WavesKeeper.auth()
- Store as external account type
- All transactions through Keeper: WavesKeeper.signAndPublishTransaction()
```

#### 7. **Migration Tool**
**Current:** Skeleton only

**Implementation:**
```typescript
// dcc-react/src/pages/MigratePage.tsx
- Detect legacy wallet format in localStorage
- Parse old structure
- Map to new schema
- Migrate transaction cache
- Update storage keys
- Show migration progress
- Backup old data first
```

---

### **LOW PRIORITY (Nice to Have)**

#### 8. **Stand/Kiosk Mode**
- Public display mode with large QR codes
- Auto-lock after inactivity
- Fullscreen presentation mode

#### 9. **Unavailable Page**
- Service status dashboard
- Node health checks
- Alternative node URLs

---

## 🔄 BACKEND INTEGRATION REQUIREMENTS

### **Critical: Maintain Exact Angular API Compatibility**

All React implementations must use the same backend patterns as Angular:

#### **1. Transaction Signing**
```typescript
// Angular: Uses data-service/sign.ts
// React Must Use: Same data-service/sign.ts module

import { sign } from '../../../data-service/sign';
const signedTx = await sign(txData, privateKey);
```

#### **2. API Endpoints**
```typescript
// Angular uses: data-service/api/
// React must use: Same structure

import { addressAPI } from '../../../data-service/api/address';
import { assetsAPI } from '../../../data-service/api/assets';
import { matcherAPI } from '../../../data-service/api/matcher';
```

#### **3. Seed Derivation**
```typescript
// Angular: data-service/classes/Seed.ts
// React: Must produce identical addresses

import { Seed } from '../../../data-service/classes/Seed';
const seed = new Seed(phrase);
const address = seed.address; // Must match Angular exactly
```

#### **4. Storage Structure**
```typescript
// Angular: data-service/store.ts
// React: Must use identical localStorage keys and structure

localStorage.setItem('wavesAccounts', JSON.stringify(accounts));
// Key naming must match Angular for compatibility
```

---

## 🎨 STYLING CONSISTENCY GUIDE

All new pages must follow the established Material UI pattern:

### **Page Structure:**
```typescript
// Animated gradient background
const PageContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
    : 'linear-gradient(135deg, #e8f0fe 0%, #f5f7fa 50%, #e3f2fd 100%)',
  backgroundSize: '200% 200%',
  animation: `${gradientShift} 15s ease infinite`,
}));

// Glassmorphism content cards
const ContentWrapper = styled(Container)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(26, 31, 58, 0.85)'
    : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(20px)',
  borderRadius: theme.spacing(3),
  border: `1px solid ${theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.05)'}`,
}));

// Floating decorative elements
<FloatingShape delay={0} size={200} top="10%" left="5%" />
<GlowOrb color="#1f5af6" top="20%" left="15%" size={300} />
```

### **Animation Requirements:**
- Fade in on mount (600-800ms)
- Slide animations for content (800-1000ms)
- Stagger animations for lists (100ms delay per item)
- Smooth transitions (0.3s ease)
- Hover effects with translateY(-2px to -8px)

### **Color Palette:**
- Primary: `#1f5af6` → `#5a81ff` (gradient)
- Success: `#4caf50`
- Error: `#f44336`
- Warning: `#ff9800`
- Info: `#2196f3`

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: Critical Path** (Week 1)
- [x] SaveSeed Page - Complete with backend
- [ ] Sessions Management System
- [ ] SwitchAccount Page - Full implementation
- [ ] RestoreFromBackup Page - Full implementation
- [ ] Backup export in Settings

### **Phase 2: Import Methods** (Week 2)
- [ ] Complete ImportAccount with data-service
- [ ] KeeperImportPage - Full implementation
- [ ] LedgerImportPage - Full implementation
- [ ] MigratePage - Full implementation

### **Phase 3: DEX Enhancement** (Week 3)
- [ ] BuyOrderForm component
- [ ] Real-time WebSocket integration
- [ ] Order placement backend
- [ ] Order cancellation
- [ ] TradingView chart data binding
- [ ] Trade history real data

### **Phase 4: Wallet Enhancement** (Week 4)
- [ ] Asset details page
- [ ] Transaction filtering
- [ ] Advanced leasing features
- [ ] Export functionality
- [ ] Bulk operations

### **Phase 5: Desktop & Polish** (Week 5)
- [ ] DesktopPage - Full implementation
- [ ] DesktopUpdatePage - Auto-updater
- [ ] DexDemoPage - Tutorial system
- [ ] StandPage - Kiosk mode
- [ ] UnavailablePage - Status page

---

## 🧪 TESTING REQUIREMENTS

### **Backend Compatibility Tests:**
1. **Seed Derivation Test:**
   - Generate address from same seed in Angular and React
   - Addresses must match exactly

2. **Transaction Signature Test:**
   - Create identical transaction in both versions
   - Signatures must match byte-for-byte

3. **Encryption Test:**
   - Encrypt seed with same password in both versions
   - Decrypt in other version successfully

4. **Storage Compatibility:**
   - Export from Angular, import to React
   - Export from React, import to Angular

### **API Integration Tests:**
1. Verify all API calls produce identical request payloads
2. Test all transaction types against testnet
3. Verify WebSocket message handling
4. Test error scenarios

---

## 📝 NOTES

### **Design System Adherence:**
- All pages use Material UI components consistently
- Glassmorphism pattern throughout
- Animated gradients on all auth/standalone pages
- Responsive breakpoints: xs, sm, md, lg, xl
- Dark/light theme support via ThemeContext

### **Code Organization:**
- Pages in `dcc-react/src/pages/`
- Features in `dcc-react/src/features/`
- Shared components in `dcc-react/src/components/`
- API services reference `data-service/` directly
- Types in `dcc-react/src/types/`

### **Backend Integration:**
- Direct imports from `../../../data-service/`
- Use existing Seed, sign, API modules
- No duplication of backend logic
- Maintain exact compatibility

---

## 🚀 NEXT STEPS

1. **Immediate:** Fix SaveSeedPage data-service imports
2. **Today:** Implement Sessions Management
3. **This Week:** Complete all import flows (Backup, Keeper, Ledger)
4. **Next Week:** DEX backend integration
5. **Following:** Wallet enhancements and polish

---

**Document Status:** Living document - Update as features are implemented
