# Gateway Bridge Migration Plan
**React Migration of Angular Gateway/Bridge Functionality**

## Executive Summary

The Angular version has a **Gateway/Bridge system** for depositing and withdrawing cryptocurrency assets (primarily BTC) between external blockchains and DecentralChain. This document provides a complete migration plan to implement this functionality in the React Bridge page.

---

## Angular Gateway Architecture Analysis

### Core Components

#### 1. **Gateway Services** (`src/modules/utils/services/gateways/`)

**WavesGatewayService.js** (Primary Gateway):
```javascript
// Handles DecentralChain native gateway operations
GATEWAYS = {
  [WavesApp.defaultAssets.BTC]: { waves: 'BTC', gateway: 'BTC' }
}

Methods:
- getDepositDetails(asset, walletAddress) 
  → Returns: { address, minimumAmount, maximumAmount, gatewayFee, ... }
  
- getWithdrawDetails(asset, targetAddress)
  → Returns: { address, attachment, minimumAmount, maximumAmount, gatewayFee, ... }
  
- getDepositAddress(asset, walletAddress) 
  → For "deposit" type gateways (static tunnel address)
  
- getRobinAddress(asset, walletAddress, toTN, recaptcha)
  → For "round-robin" type gateways (temporary address with expiry)
```

**CoinomatService.js** (Legacy, mostly commented out):
```javascript
// Coinomat gateway service (deprecated)
// Used for BTC, LTC, ZEC, BCH, DASH, XMR
// API: ${WavesApp.network.coinomat}/api/v1
```

**GatewayService.js** (Coordinator):
```javascript
// Central gateway manager
Methods:
- getDepositDetails(asset, wavesAddress)
- getWithdrawDetails(asset, targetAddress, paymentId)
- hasSupportOf(asset, 'deposit' | 'withdraw')
- canUseGateway(asset) → Checks permissions
```

#### 2. **Configuration** (`configs/mainnet.json`)

```json
{
  "assets": {
    "BTC": "25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK"
  },
  "wavesGateway": {
    "25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK": {
      "url": "https://btc.decentralchain.io",
      "isThirdParty": false,
      "regex": "^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$"
    }
  }
}
```

#### 3. **UI Components**

**Receive Modal** (`src/modules/utils/modals/receive/`):
- `ReceiveCtrl.js` - Modal controller with tabs
- `receiveCryptocurrency/ReceiveCryptocurrency.js` - Cryptocurrency deposit component
- Shows: Deposit address, min/max amounts, fees, gateway info

**Key Features:**
- **Deposit Flow**: Get gateway deposit address → User sends BTC → Gateway mints wrapped BTC on DecentralChain
- **Withdraw Flow**: User sends wrapped BTC to gateway address with target BTC address in attachment
- **Gateway Types**: 
  - `deposit`: Static tunnel address per user
  - `round-robin`: Temporary address with expiry + recaptcha

---

## Gateway API Flow Analysis

### Deposit Flow (BTC → DecentralChain)

1. **Get Gateway Info** (`/api/fullinfo` or `/api/full-info/{network}/{ticker}`):
```javascript
Response: {
  otherAddress: "bc1qxyz...",      // BTC address to send to
  minAmount: "0.001",               // Min BTC to deposit
  maxAmount: "10",                  // Max BTC to deposit
  fee: "0.0001",                    // Gateway fee
  recovery_amount: "0.0005",        // Min for recovery
  recovery_fee: "0.0002",           // Recovery fee
  email: "support@example.com",     // Support email
  company: "DecentralChain Gateway",
  disclaimer: "https://...",         // Terms link
  type: "deposit" | "round-robin",   // Gateway type
  tnAddress: "3P..."                 // Gateway's DecentralChain address
}
```

2. **For Static Tunnel** (`type: "deposit"`):
```javascript
GET /tunnel/{userWalletAddress}
Response: {
  address: "bc1qxyz..."  // Static BTC address for this user
}
```

3. **For Round-Robin** (`type: "round-robin"`):
```javascript
POST /api/deposits
Body: {
  ticker: "BTC",
  dstAddress: "3P...",  // User's DecentralChain address
  srcNetwork: "Bitcoin",
  dstNetwork: "TurtleNetwork",
  recaptcha: "token"
}
Response: {
  depositAddress: "bc1qxyz...",  // Temporary BTC address
  expiry: "2024-12-01T12:00:00Z"  // Address expires
}
```

### Withdraw Flow (DecentralChain → BTC)

1. **Get Withdrawal Info** (same `/api/fullinfo` endpoint):
```javascript
Response: {
  tnAddress: "3P...",         // Gateway's DecentralChain address
  minAmount: "0.001",         // Min to withdraw
  maxAmount: "10",            // Max to withdraw
  other_total_fee: "0.0002",  // Total fee (gateway + network)
  type: "deposit" | "round-robin"
}
```

2. **User Creates Transfer Transaction**:
```javascript
Transfer {
  recipient: "3P...",                    // Gateway address
  assetId: "25iPQ8z...",                 // Wrapped BTC asset ID
  amount: 0.01 * 10^8,                   // Amount in satoshis
  attachment: "bc1qUserDestination...",  // User's BTC address
  fee: 0.001 * 10^8                      // Network fee
}
```

---

## React Migration Plan

### Phase 1: Create Gateway Service Layer

**File**: `dcc-react/src/services/gateway/GatewayService.ts`

```typescript
interface GatewayConfig {
  url: string;
  isThirdParty: boolean;
  regex: string;
  otherNetwork?: string;
}

interface DepositDetails {
  address: string;              // Deposit address (BTC/external)
  minimumAmount: BigNumber;
  maximumAmount: BigNumber;
  gatewayFee: BigNumber;
  disclaimerLink?: string;
  minRecoveryAmount?: BigNumber;
  recoveryFee?: BigNumber;
  supportEmail?: string;
  operator?: string;
  walletAddress: string;        // User's DecentralChain address
  gatewayType: 'deposit' | 'round-robin';
  gatewayUrl: string;
  expiry?: Date;                // For round-robin
}

interface WithdrawDetails {
  address: string;              // Gateway's DecentralChain address
  attachment: string;           // User's destination address (BTC)
  minimumAmount: BigNumber;
  maximumAmount: BigNumber;
  gatewayFee: BigNumber;
  gatewayType: string;
  gatewayUrl: string;
}

class GatewayService {
  // Check if asset has gateway support
  hasSupportOf(assetId: string, type: 'deposit' | 'withdraw'): boolean
  
  // Get deposit details for asset
  getDepositDetails(assetId: string, userAddress: string): Promise<DepositDetails>
  
  // Get withdraw details for asset  
  getWithdrawDetails(assetId: string, targetAddress: string): Promise<WithdrawDetails>
  
  // Validate external address format
  validateAddress(address: string, assetId: string): boolean
  
  // Get temporary round-robin address
  getRobinAddress(assetId: string, address: string, recaptcha: string): Promise<{ address: string, expiry: Date }>
}
```

**Implementation Steps**:
1. Read gateway config from `ConfigContext` (`network.wavesGateway`)
2. Implement API calls to gateway endpoints
3. Handle both deposit types (static tunnel vs round-robin)
4. Add address validation with regex from config
5. Error handling for gateway unavailability

---

### Phase 2: Create Bridge/Gateway UI Components

**File**: `dcc-react/src/features/bridge/DepositAsset.tsx`

```typescript
interface DepositAssetProps {
  asset: Asset;
  userAddress: string;
  onClose: () => void;
}

// Component Features:
- Display gateway deposit address (QR code + copy button)
- Show min/max deposit amounts
- Display gateway fee and estimated time
- Show disclaimer and support contact
- Handle round-robin type with recaptcha and expiry timer
- Instructions for depositing external asset
```

**File**: `dcc-react/src/features/bridge/WithdrawAsset.tsx`

```typescript
interface WithdrawAssetProps {
  asset: Asset;
  userAddress: string;
  onClose: () => void;
}

// Component Features:
- Input field for destination address (BTC address)
- Address validation with regex
- Amount input with min/max validation
- Fee calculation and display
- Transaction preview
- Sign and broadcast withdrawal transaction
```

**File**: `dcc-react/src/features/bridge/BridgeAssetSelector.tsx`

```typescript
// Select which asset to bridge
// Filter: Only show assets with gateway support
// Display: Asset icon, name, balance, "Deposit" and "Withdraw" buttons
```

---

### Phase 3: Update Bridge Page

**File**: `dcc-react/src/pages/Bridge/Bridge.tsx`

**Current State**: Placeholder UI with "Coming Soon" message

**New Implementation**:

```typescript
export const Bridge: React.FC = () => {
  const [mode, setMode] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const { user } = useAuth();
  const { network } = useConfig();
  
  // Get list of assets with gateway support
  const gatewayAssets = useMemo(() => {
    return Object.keys(network.wavesGateway).map(assetId => ({
      assetId,
      config: network.wavesGateway[assetId],
      hasDeposit: true,
      hasWithdraw: true,
    }));
  }, [network]);

  return (
    <Container>
      {/* Mode Toggle: Deposit | Withdraw */}
      <ToggleButtonGroup value={mode} onChange={setMode}>
        <ToggleButton value="deposit">Deposit to DecentralChain</ToggleButton>
        <ToggleButton value="withdraw">Withdraw to External</ToggleButton>
      </ToggleButtonGroup>

      {/* Asset Grid */}
      <BridgeAssetSelector
        assets={gatewayAssets}
        onSelect={setSelectedAsset}
      />

      {/* Deposit/Withdraw Modal */}
      {selectedAsset && mode === 'deposit' && (
        <DepositAsset
          asset={selectedAsset}
          userAddress={user.address}
          onClose={() => setSelectedAsset(null)}
        />
      )}

      {selectedAsset && mode === 'withdraw' && (
        <WithdrawAsset
          asset={selectedAsset}
          userAddress={user.address}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </Container>
  );
};
```

---

### Phase 4: Transaction Integration

**File**: `dcc-react/src/hooks/useGatewayTransaction.ts`

```typescript
export const useGatewayTransaction = () => {
  const { user } = useAuth();
  const { broadcastTransaction } = useTransactions();

  const withdraw = async (
    assetId: string,
    amount: number,
    destinationAddress: string,
    gatewayDetails: WithdrawDetails
  ) => {
    // Build transfer transaction
    const tx = {
      type: 4,  // Transfer
      recipient: gatewayDetails.address,  // Gateway's DCC address
      assetId: assetId,
      amount: amount,
      attachment: destinationAddress,  // BTC address in attachment
      fee: 100000,  // 0.001 DCC
      timestamp: Date.now(),
    };

    // Sign transaction (handles Ledger, seed, etc.)
    const signedTx = await signTransaction(tx);

    // Broadcast
    return await broadcastTransaction(signedTx);
  };

  return { withdraw };
};
```

---

### Phase 5: Testing & Validation

**Test Cases**:

1. **BTC Deposit Flow**:
   - [ ] User selects BTC asset
   - [ ] Gateway returns deposit address
   - [ ] Display QR code and copy button
   - [ ] Show min/max amounts and fees
   - [ ] User sends BTC to address
   - [ ] Gateway mints wrapped BTC on DecentralChain

2. **BTC Withdraw Flow**:
   - [ ] User selects wrapped BTC
   - [ ] User enters destination BTC address
   - [ ] Validate BTC address format with regex
   - [ ] Calculate and display fees
   - [ ] User signs transaction
   - [ ] Transaction includes BTC address in attachment
   - [ ] Gateway sends BTC to user's address

3. **Round-Robin Gateway**:
   - [ ] Display recaptcha
   - [ ] Get temporary address with expiry
   - [ ] Show countdown timer
   - [ ] Address expires after time limit

4. **Error Handling**:
   - [ ] Gateway server unavailable
   - [ ] Invalid destination address
   - [ ] Amount below minimum
   - [ ] Amount above maximum
   - [ ] Insufficient balance

---

## File Structure

```
dcc-react/src/
├── services/
│   └── gateway/
│       ├── GatewayService.ts          # Core gateway logic
│       ├── types.ts                   # TypeScript interfaces
│       └── utils.ts                   # Address validation, etc.
│
├── features/
│   └── bridge/
│       ├── DepositAsset.tsx           # Deposit modal
│       ├── WithdrawAsset.tsx          # Withdraw modal
│       ├── BridgeAssetSelector.tsx    # Asset grid
│       ├── GatewayInfo.tsx            # Info display component
│       ├── AddressInput.tsx           # Validated address input
│       └── DepositAddress.tsx         # QR code + copy component
│
├── hooks/
│   ├── useGateway.ts                  # Gateway service hook
│   └── useGatewayTransaction.ts       # Transaction signing/broadcast
│
└── pages/
    └── Bridge/
        └── Bridge.tsx                 # Updated main page
```

---

## API Endpoints Reference

### Gateway API (btc.decentralchain.io)

```
GET  /api/fullinfo
GET  /api/full-info/{network}/{ticker}
GET  /tunnel/{walletAddress}
POST /api/deposits
```

### Data Service API (data-service.decentralchain.io)

```
GET  /v0/assets/{assetId}
POST /v0/transactions/broadcast
```

---

## Configuration Updates Needed

**No changes needed** - Gateway configuration already exists in `configs/mainnet.json`:

```json
{
  "wavesGateway": {
    "25iPQ8zKBRR5q1UKUksCijiyb18EGupggjus6muEbuvK": {
      "url": "https://btc.decentralchain.io",
      "isThirdParty": false,
      "regex": "^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$"
    }
  }
}
```

---

## Migration Priority

### HIGH PRIORITY (Core Functionality)
1. ✅ Gateway Service implementation
2. ✅ Deposit flow (BTC → DecentralChain)
3. ✅ Withdraw flow (DecentralChain → BTC)
4. ✅ Address validation

### MEDIUM PRIORITY (UX Enhancement)
5. ⏸️ QR code generation for deposit address
6. ⏸️ Transaction history for gateway operations
7. ⏸️ Recaptcha integration for round-robin
8. ⏸️ Expiry timer for temporary addresses

### LOW PRIORITY (Advanced Features)
9. ⏸️ Gateway health monitoring
10. ⏸️ Multi-gateway support (fallback)
11. ⏸️ Gateway analytics

---

## Key Differences from Angular

1. **React Uses**:
   - TypeScript for type safety
   - React hooks for state management
   - Material-UI components
   - Modern async/await patterns

2. **Improvements**:
   - Better error handling with try/catch
   - Loading states with skeletons
   - Real-time address validation
   - Better mobile responsiveness
   - Cleaner separation of concerns

3. **Maintained**:
   - Same API endpoints
   - Same transaction structure
   - Same attachment format
   - Same fee calculations

---

## Success Criteria

- [ ] BTC deposits work end-to-end
- [ ] BTC withdrawals work end-to-end
- [ ] Address validation prevents invalid addresses
- [ ] Fees calculated correctly
- [ ] Min/max amounts enforced
- [ ] Error messages clear and helpful
- [ ] UI matches modern React design system
- [ ] Works with all authentication types (seed, Ledger, etc.)
- [ ] Transaction signing uses existing infrastructure
- [ ] No breaking changes to backend

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Prioritize phases** based on business needs
3. **Start with Phase 1** (Gateway Service)
4. **Test each phase** before moving to next
5. **Document API responses** for reference
6. **Add comprehensive error handling**

---

## Questions for Clarification

1. Should we support other assets besides BTC? (LTC, ETH, etc.)
2. Is the Coinomat gateway still needed or fully deprecated?
3. Should we add transaction history specific to gateway operations?
4. Do we need analytics/tracking for gateway usage?
5. Should we implement gateway health checks/status monitoring?

---

## Timeline Estimate

- **Phase 1** (Gateway Service): 2-3 days
- **Phase 2** (UI Components): 3-4 days
- **Phase 3** (Bridge Page Update): 1-2 days
- **Phase 4** (Transaction Integration): 2-3 days
- **Phase 5** (Testing & QA): 2-3 days

**Total Estimated Time**: 10-15 days

---

## Technical Notes

1. **Security**: Never store private keys in gateway service
2. **Validation**: Always validate addresses before broadcasting
3. **Fees**: Calculate fees client-side, verify server-side
4. **Errors**: Handle network errors gracefully with retries
5. **UX**: Show progress for multi-step operations
6. **Mobile**: Ensure QR codes work on mobile
7. **Accessibility**: Add proper ARIA labels and keyboard navigation

---

**Document Version**: 1.0  
**Last Updated**: November 23, 2025  
**Author**: GitHub Copilot  
**Status**: Ready for Implementation
