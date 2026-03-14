# React Migration Implementation Plan
## Prioritized Action Plan for Feature Parity with Angular

**Based on:** ANGULAR-REACT-FEATURE-MAPPING.md  
**Created:** October 17, 2025

---

## 📊 SUMMARY STATISTICS

**Total Angular Modules:** 20  
**Fully Implemented:** 7 (35%)  
**Partially Implemented:** 5 (25%)  
**Not Implemented:** 8 (40%)  

**Overall Completion:** ~65%

---

## 🎯 IMPLEMENTATION PRIORITIES

### **🔴 CRITICAL (Must Complete for Basic Feature Parity)**

#### **1. Sessions Management System** ⭐ HIGHEST PRIORITY
**Status:** Does not exist in React  
**Impact:** Blocks multi-account support, session security  
**Effort:** 2-3 days

**Files to Create:**
```
dcc-react/src/features/sessions/
├── SessionContext.tsx
├── SessionManager.tsx
├── SessionSynchronizer.ts (BroadcastChannel)
├── useSession.ts
└── types.ts
```

**Integration Required:**
- Update `AuthContext.tsx` to use SessionContext
- Add lock/unlock UI to `Header.tsx`
- Add activity monitoring to `App.tsx`
- Store session state in localStorage

**Angular Reference:** `src/modules/sessions/`

---

#### **2. Account Switching** ⭐ HIGH PRIORITY
**Status:** Skeleton exists, needs full implementation  
**Impact:** Users cannot switch between multiple accounts  
**Effort:** 1 day

**File to Complete:**
- `dcc-react/src/pages/SwitchAccountPage.tsx`

**Requirements:**
- Fetch all accounts from storage
- Display with avatars and balances
- Account type badges (Seed/Ledger/Keeper)
- Password authentication if locked
- Quick switch if unlocked

**Angular Reference:** `src/modules/switch/controllers/SwitchAccountCtrl.js`

---

#### **3. Backup & Restore** ⭐ HIGH PRIORITY
**Status:** Skeleton exists, critical for account recovery  
**Impact:** Users cannot backup/restore wallets  
**Effort:** 2 days

**Files to Complete:**
1. **Restore:** `dcc-react/src/pages/RestoreFromBackupPage.tsx`
   - File dropzone component
   - Password decryption
   - JSON validation
   - Account import to storage
   
2. **Backup Export:** `dcc-react/src/features/settings/BackupSettings.tsx` (NEW)
   - Add to SettingsPage
   - Encrypt wallet data
   - Download as JSON file

**Backend:** Must match Angular backup format exactly
**Angular Reference:** `src/modules/fromBackup/`, `src/modules/restore/`

---

#### **4. DEX Backend Integration** ⭐ HIGH PRIORITY
**Status:** UI complete, backend missing  
**Impact:** Trading doesn't work  
**Effort:** 3-4 days

**Tasks:**
1. Create `BuyOrderForm.tsx` (mirror SellOrderForm)
2. Integrate `data-service/api/matcher/` for order placement
3. WebSocket real-time data binding
4. Order cancellation functionality
5. Price calculation engine
6. Fee calculations

**Files to Update:**
- `dcc-react/src/features/dex/BuyOrderForm.tsx` (NEW)
- `dcc-react/src/features/dex/OrderBook.tsx` (complete)
- `dcc-react/src/features/dex/TradeHistory.tsx` (complete)
- `dcc-react/src/features/dex/UserOrders.tsx` (complete)
- `dcc-react/src/features/dex/useDexWebSocket.ts` (enhance)

**Angular Reference:** `src/modules/dex/`

---

### **🟡 MEDIUM PRIORITY (Important for Full Functionality)**

#### **5. Ledger Hardware Wallet**
**Status:** Skeleton only  
**Impact:** Hardware wallet users cannot import accounts  
**Effort:** 2 days

**Implementation:**
- Install dependencies: `@ledgerhq/hw-app-waves`, `@ledgerhq/hw-transport-webusb`
- Device detection UI
- Derivation path selector
- Public key extraction
- Transaction signing via Ledger

**File:** `dcc-react/src/pages/LedgerImportPage.tsx`  
**New Service:** `dcc-react/src/services/ledger/ledgerService.ts`

**Angular Reference:** `src/modules/ledger/`

---

#### **6. Keeper Extension Integration**
**Status:** Skeleton only  
**Impact:** Keeper users cannot import accounts  
**Effort:** 1 day

**Implementation:**
- Detect `window.WavesKeeper`
- Request connection/permissions
- Get account details
- Store as external account
- Transaction signing via Keeper API

**File:** `dcc-react/src/pages/KeeperImportPage.tsx`

**Angular Reference:** `src/modules/keeper/`

---

#### **7. Account Migration Tool**
**Status:** Skeleton only  
**Impact:** Users with old wallet format cannot migrate  
**Effort:** 1-2 days

**Implementation:**
- Detect legacy storage format
- Parse old schema
- Convert to new structure
- Migrate transaction cache
- Show progress indicator

**File:** `dcc-react/src/pages/MigratePage.tsx`

**Angular Reference:** `src/modules/migrate/`

---

#### **8. Wallet Enhancements**
**Status:** Core features exist, advanced features missing  
**Impact:** Limited wallet functionality  
**Effort:** 2-3 days

**Tasks:**
1. **Asset Details Page:**
   - Create route: `/desktop/wallet/assets/:assetId`
   - Display full asset info, chart, history
   
2. **Transaction Filtering:**
   - Type dropdown filter
   - Date range picker
   - Search by TX ID
   - Export to CSV

3. **Advanced Leasing:**
   - Cancel lease functionality
   - Lease history table
   - Node statistics
   - Rewards calculator

---

### **🔵 LOW PRIORITY (Polish & Nice-to-Have)**

#### **9. Desktop-Specific Features**
**Effort:** 2 days

**Files:**
- `DesktopPage.tsx` - Welcome dashboard for Electron
- `DesktopUpdatePage.tsx` - Auto-update UI

**Angular Reference:** `src/modules/desktop/`, `src/modules/desktopUpdate/`

---

#### **10. DEX Demo/Tutorial**
**Effort:** 2 days

**File:** `dcc-react/src/pages/DexDemoPage.tsx`  
**Features:** Interactive trading tutorial with mock data

---

#### **11. Stand/Kiosk Mode**
**Effort:** 1 day

**File:** `dcc-react/src/pages/StandPage.tsx`  
**Features:** Public display mode, large QR codes, auto-lock

---

#### **12. Unavailable/Maintenance Page**
**Effort:** 0.5 days

**File:** `dcc-react/src/pages/UnavailablePage.tsx`  
**Features:** Service status, alternative nodes

---

## 📅 RECOMMENDED IMPLEMENTATION SEQUENCE

### **Week 1: Critical Foundation**
**Goal:** Core account management working

**Day 1-2:** Sessions Management System
- Create SessionContext and SessionManager
- Integrate with AuthContext
- Add lock/unlock UI to Header
- Cross-tab synchronization

**Day 3:** Account Switching
- Complete SwitchAccountPage
- Multi-account support
- Password validation

**Day 4-5:** Backup & Restore
- RestoreFromBackupPage complete implementation
- BackupSettings in Settings page
- Test encryption compatibility with Angular

**Deliverable:** Users can manage multiple accounts and backup/restore wallets

---

### **Week 2: Import Methods**
**Goal:** All account import methods functional

**Day 1:** ImportAccount Enhancement
- Complete data-service integration
- Seed validation improvements
- Better error handling

**Day 2-3:** Ledger Integration
- Hardware wallet support
- USB device communication
- Transaction signing

**Day 4:** Keeper Integration
- Extension detection
- Account import
- Transaction signing

**Day 5:** Migration Tool
- Legacy wallet migration
- Progress tracking

**Deliverable:** All wallet import methods functional

---

### **Week 3: DEX Trading**
**Goal:** Full trading functionality

**Day 1-2:** Order Placement
- BuyOrderForm component
- Backend integration with matcher API
- Fee calculations
- Balance validation

**Day 3:** Real-time Data
- WebSocket integration
- Live order book
- Trade history feed

**Day 4:** Order Management
- Cancel orders
- Order status tracking
- Filled percentage

**Day 5:** Chart Integration
- TradingView real data
- Historical candlesticks

**Deliverable:** Fully functional DEX trading

---

### **Week 4: Wallet Polish**
**Goal:** Advanced wallet features

**Day 1-2:** Asset Details
- Create asset detail page
- Price charts
- Transfer history per asset

**Day 3:** Transaction Features
- Filtering and search
- Export to CSV
- Pagination

**Day 4-5:** Leasing Advanced
- Cancel functionality
- History and stats
- Rewards calculator

**Deliverable:** Professional-grade wallet experience

---

### **Week 5: Desktop & Final Polish**
**Goal:** Desktop features and remaining items

**Day 1-2:** Desktop Features
- DesktopPage dashboard
- Auto-update system

**Day 3:** DEX Demo
- Tutorial system
- Educational content

**Day 4:** Additional Pages
- Stand/Kiosk mode
- Unavailable page

**Day 5:** Testing & Bug Fixes
- Cross-browser testing
- Backend compatibility verification
- Performance optimization

**Deliverable:** 100% feature parity with Angular

---

## 🔧 TECHNICAL SPECIFICATIONS

### **Data-Service Integration Pattern**

All backend calls must follow this pattern:

```typescript
// ✅ CORRECT - Direct data-service import
import * as ds from '../../../data-service';

const handleAction = async () => {
  try {
    const api = ds.signature.getDefaultSignatureApi(user);
    const result = await ds.api.address.getBalance(user.address);
    // Process result
  } catch (error) {
    // Handle error
  }
};
```

```typescript
// ❌ WRONG - Creating new API wrappers
import { customApiWrapper } from '@/api/custom';
// This breaks compatibility with Angular
```

### **Storage Compatibility**

Must use exact same localStorage keys as Angular:

```typescript
// Account storage
localStorage.setItem('wavesAccounts', JSON.stringify(accounts));
localStorage.getItem('wavesAccounts');

// Active user
localStorage.setItem('activeAccount', address);

// Settings
localStorage.setItem('wavesSettings', JSON.stringify(settings));
```

### **Seed Derivation Verification**

Test that addresses match:

```typescript
// Test case
const seedPhrase = 'word1 word2 ... word15';

// Angular
const angularSeed = new Seed(seedPhrase);
const angularAddress = angularSeed.address;

// React
const reactSeed = new Seed(seedPhrase);
const reactAddress = reactSeed.address;

// Must match
console.assert(angularAddress === reactAddress, 'Address mismatch!');
```

---

## 🧪 TESTING CHECKLIST

### **Before Marking Complete:**

**For Each New Page:**
- [ ] Matches Angular functionality exactly
- [ ] Material UI styling consistent with other pages
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark/light theme support
- [ ] Animations (Fade, Slide)
- [ ] Error handling
- [ ] Loading states
- [ ] Accessibility (ARIA labels, keyboard navigation)

**Backend Integration:**
- [ ] Uses data-service modules directly
- [ ] API calls produce identical payloads as Angular
- [ ] Transaction signatures match Angular
- [ ] Storage format compatible
- [ ] Encryption/decryption compatible

**Quality Checks:**
- [ ] TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] No console errors
- [ ] Performance optimized (React.memo where needed)
- [ ] Error boundaries in place

---

## 📦 DELIVERABLES PER PRIORITY

### **Critical Priority Deliverables:**
1. ✅ SaveSeedPage with backend integration
2. SessionManager with cross-tab sync
3. Complete SwitchAccountPage
4. Backup export + RestoreFromBackupPage
5. DEX order placement + real-time data

### **Medium Priority Deliverables:**
6. LedgerImportPage with hw-app-waves
7. KeeperImportPage with extension API
8. MigratePage with progress tracking
9. Asset details page + transaction filtering
10. Advanced leasing features

### **Low Priority Deliverables:**
11. DesktopPage dashboard
12. DesktopUpdatePage auto-updater
13. DexDemoPage tutorial
14. StandPage kiosk mode
15. UnavailablePage status checker

---

## 🚨 BLOCKERS & RISKS

### **Current Blockers:**

1. **SaveSeedPage TypeScript Error:**
   - Issue: Cannot find module `../../../data-service`
   - Fix: Update tsconfig paths or adjust import
   - Priority: Immediate

2. **Missing Dependencies:**
   - Ledger: `@ledgerhq/hw-app-waves`, `@ledgerhq/hw-transport-webusb`
   - Install before implementing Ledger support

### **Potential Risks:**

1. **Backend Compatibility:**
   - Risk: React using different crypto/signing than Angular
   - Mitigation: Use data-service directly, verify signatures match

2. **Storage Migration:**
   - Risk: Breaking changes to localStorage format
   - Mitigation: Maintain backward compatibility, migration tool

3. **Performance:**
   - Risk: Real-time DEX data overwhelming React
   - Mitigation: Virtualization, debouncing, React.memo

---

## 🎨 STYLING REQUIREMENTS

Every new page must include:

1. **Animated Gradient Background:**
   ```typescript
   background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)',
   backgroundSize: '200% 200%',
   animation: `${gradientShift} 15s ease infinite`
   ```

2. **Glassmorphism Content:**
   ```typescript
   background: 'rgba(26, 31, 58, 0.85)',
   backdropFilter: 'blur(20px)',
   border: '1px solid rgba(255, 255, 255, 0.1)'
   ```

3. **Floating Decorations:**
   ```typescript
   <FloatingShape delay={0} size={200} top="10%" left="5%" />
   <GlowOrb color="#1f5af6" top="20%" left="15%" size={300} />
   ```

4. **Entrance Animations:**
   ```typescript
   <Fade in={isVisible} timeout={600}>
     <Slide direction="up" timeout={800}>
       {/* Content */}
     </Slide>
   </Fade>
   ```

---

## 📋 PHASE 1 DETAILED TASKS (Week 1)

### **Monday: Sessions Management**
- [ ] Create SessionContext with types
- [ ] Implement SessionManager class
- [ ] Add BroadcastChannel synchronization
- [ ] Create useSession hook
- [ ] Add session timeout logic (15min)
- [ ] Integrate with AuthContext
- [ ] Add lock/unlock button to Header
- [ ] Test multi-tab synchronization

### **Tuesday: Sessions Integration**
- [ ] Add activity monitoring to App.tsx
- [ ] Implement auto-lock on inactivity
- [ ] Session persistence across reloads
- [ ] Test session switching
- [ ] Add session indicator UI
- [ ] Document session management

### **Wednesday: Account Switching**
- [ ] Fetch all accounts from localStorage
- [ ] Display account list with Material UI
- [ ] Add account avatars (gradient backgrounds)
- [ ] Implement account type badges
- [ ] Add balance fetching per account
- [ ] Password validation for locked sessions
- [ ] Quick switch for unlocked sessions
- [ ] Test with multiple accounts

### **Thursday: Backup Creation**
- [ ] Create BackupSettings component
- [ ] Implement wallet data encryption
- [ ] Generate backup JSON file
- [ ] Add download functionality
- [ ] Add to Settings page
- [ ] Test backup file format
- [ ] Verify compatibility with Angular

### **Friday: Backup Restoration**
- [ ] Create file dropzone UI
- [ ] Add drag & drop support
- [ ] Implement file validation
- [ ] Password input for decryption
- [ ] Decrypt backup file
- [ ] Import accounts to storage
- [ ] Progress stepper component
- [ ] Test restore from Angular backup
- [ ] Test restore from React backup

---

## 💻 CODE EXAMPLES

### **Session Management Implementation:**

```typescript
// dcc-react/src/features/sessions/SessionContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface Session {
  id: string;
  userId: string;
  address: string;
  createdAt: number;
  lastActivity: number;
  isLocked: boolean;
}

interface SessionContextValue {
  activeSession: Session | null;
  sessions: Session[];
  createSession: (user: User) => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  lockSession: () => void;
  unlockSession: (password: string) => Promise<boolean>;
  refreshActivity: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);

  // Auto-lock after 15 minutes of inactivity
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      if (activeSession && !activeSession.isLocked) {
        const inactiveTime = Date.now() - activeSession.lastActivity;
        if (inactiveTime > 15 * 60 * 1000) {
          lockSession();
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInactivity);
  }, [activeSession]);

  // Cross-tab synchronization
  useEffect(() => {
    const channel = new BroadcastChannel('dcc_sessions');
    
    channel.onmessage = (event) => {
      switch (event.data.type) {
        case 'session-created':
          setSessions(prev => [...prev, event.data.session]);
          break;
        case 'session-locked':
          if (activeSession?.id === event.data.sessionId) {
            setActiveSession(prev => prev ? {...prev, isLocked: true} : null);
          }
          break;
        // ... handle other events
      }
    };

    return () => channel.close();
  }, [activeSession]);

  // Implementation of methods...
  
  return (
    <SessionContext.Provider value={{...}}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};
```

### **Backup/Restore Format:**

```typescript
// Backup file structure (must match Angular)
interface WalletBackup {
  version: string; // "3.0"
  encrypted: boolean;
  timestamp: number;
  data: {
    accounts: Array<{
      address: string;
      publicKey: string;
      encryptedSeed: string; // Double encrypted
      name?: string;
      userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
    }>;
    settings: {
      language: string;
      theme: 'dark' | 'light';
      network: string;
    };
    checksum: string; // SHA-256 of data
  };
}

// Encryption must use same algorithm as Angular
async function encryptBackup(data: any, password: string): Promise<string> {
  // Use crypto.subtle with same parameters as Angular
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Derive key using PBKDF2 (same as Angular)
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('dcc-salt'), // Must match Angular
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt data
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(JSON.stringify(data))
  );
  
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}
```

---

## ✅ ACCEPTANCE CRITERIA

### **For Each Feature:**

1. **Functionality:**
   - Matches Angular behavior exactly
   - All edge cases handled
   - Error scenarios covered

2. **UI/UX:**
   - Material UI components used
   - Matches design system
   - Responsive on all devices
   - Smooth animations
   - Loading states

3. **Code Quality:**
   - TypeScript strict mode passes
   - No ESLint errors
   - Proper error boundaries
   - Accessible (WCAG 2.1 AA)

4. **Backend:**
   - Uses data-service modules
   - API compatibility verified
   - Storage format compatible
   - Signatures match Angular

5. **Testing:**
   - Unit tests for logic
   - Integration tests for API calls
   - E2E tests for critical flows
   - Cross-browser tested

---

## 📈 PROGRESS TRACKING

Update this table as features are completed:

| Feature | Status | Completion Date | Developer | Notes |
|---------|--------|-----------------|-----------|-------|
| SaveSeedPage | ✅ Done | 2025-10-17 | Cline | Needs data-service import fix |
| Sessions System | 🔄 In Progress | - | - | - |
| SwitchAccount | 📋 Todo | - | - | - |
| Backup/Restore | 📋 Todo | - | - | - |
| DEX Backend | 📋 Todo | - | - | - |
| Ledger Import | 📋 Todo | - | - | - |
| Keeper Import | 📋 Todo | - | - | - |
| Migration Tool | 📋 Todo | - | - | - |
| Wallet Advanced | 📋 Todo | - | - | - |
| Desktop Features | 📋 Todo | - | - | - |

---

## 🎓 DEVELOPER NOTES

### **When Adding New Features:**

1. **Study Angular First:**
   - Read controller code
   - Check template HTML
   - Note all event handlers
   - Document backend calls

2. **Design React Version:**
   - Plan component structure
   - Choose Material UI components
   - Match design system styling
   - Plan state management

3. **Implement:**
   - Create types first
   - Build UI components
   - Add data-service integration
   - Implement error handling
   - Add loading states

4. **Test:**
   - Compare with Angular visually
   - Verify backend calls match
   - Test all user flows
   - Check error scenarios

5. **Document:**
   - Update ANGULAR-REACT-FEATURE-MAPPING.md
   - Update this IMPLEMENTATION-PLAN.md
   - Add inline code comments
   - Update progress table

---

## 🔗 RELATED DOCUMENTS

- **Feature Mapping:** `ANGULAR-REACT-FEATURE-MAPPING.md`
- **Architecture:** `docs/MIGRATION_FROM_ANGULAR.md`
- **Components:** `docs/COMPONENTS.md`
- **State Management:** `docs/STATE_MANAGEMENT.md`

---

**Last Updated:** October 17, 2025  
**Next Review:** After Week 1 completion
