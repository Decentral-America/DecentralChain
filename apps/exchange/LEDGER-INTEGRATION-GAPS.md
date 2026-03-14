# Ledger Integration - Critical Implementation Gaps

## Current Status
✅ UI/UX layout matches signup/signin pages  
✅ Web support enabled (WebHID API for Chrome/Edge)  
❌ **NOT USING DECENTRALCHAIN BLOCKCHAIN** - Missing critical integration  
❌ Authentication not integrated with multiAccount system  
❌ Transaction signing not implemented  

## What We Have
- `@decentralchain/signature-adapter` (v6.1.7) - ✅ Installed
- `@waves/ledger` (v3.6.1) - ✅ Installed  
- `@ledgerhq/hw-transport-node-hid` (v6.29.14) - ✅ Installed
- Basic UI components for device connection

## Critical Gaps

### 1. **Blockchain Integration Missing**
**Problem**: Current React implementation uses generic Ledger connection, not DecentralChain-specific

**Angular Implementation** (CORRECT):
```javascript
const signatureAdapter = require('@decentralchain/signature-adapter');
this.adapter = signatureAdapter.LedgerAdapter;

// Creates user with DecentralChain network byte
const newUser = {
    ...this.selectedUser,
    userType: 'ledger',
    name: this.name,
    networkByte: WavesApp.network.code.charCodeAt(0) // DCC network!
};
```

**React Implementation** (WRONG):
```typescript
// useLedger.ts - Using generic LedgerAdapter without DCC context
const adapterRef = useRef<typeof LedgerAdapter>(LedgerAdapter);
```

**Fix Required**:
- Import `@decentralchain/signature-adapter` properly
- Configure network byte for DecentralChain (not Waves mainnet)
- Use DecentralChain transaction types

### 2. **Authentication Integration Broken**
**Problem**: Temporary hash used instead of proper multiAccount integration

**Current Code** (WRONG):
```typescript
// ImportLedger.tsx line 139
const userWithHash: User = {
    ...userData,
    hash: `ledger_${selectedUser.address}`, // TEMPORARY!
} as User;

await login(userWithHash.hash, ''); // Empty password!
```

**Angular Implementation** (CORRECT):
```javascript
return user.create(newUser, true, true).then(() => {
    $state.go(user.getActiveState('wallet'));
});
```

**Fix Required**:
- Implement `addLedgerAccount()` in AuthContext
- Store Ledger accounts in multiAccount vault with proper encryption
- Support both first account (create) and additional accounts (addAccount)
- Handle Ledger-specific fields: `ledgerPath`, `ledgerId`, `userType: 'ledger'`

### 3. **Transaction Signing Not Implemented**
**Problem**: No transaction signing logic for Ledger devices

**Required Implementation**:
```typescript
// Should be in useLedger.ts or separate hook
const signTransaction = async (txData: any): Promise<string> => {
    // 1. Show "Confirm on Device" modal
    // 2. Call LedgerAdapter.sign(txData)
    // 3. Wait for user confirmation on device
    // 4. Return signed transaction bytes
    // 5. Handle errors (device locked, user rejected, etc.)
};
```

**Integration Points**:
- `SendAssetModalModern.tsx` - Check if `user.userType === 'ledger'`, show LedgerSignModal
- DEX trading components - Same pattern for order creation/cancellation
- Leasing components - Lease start/cancel transactions
- Any other transaction flows

### 4. **Network Configuration Missing**
**Problem**: Need to set correct network byte and node URL for DecentralChain

**Angular Configuration**:
```javascript
// configs/mainnet.json, stagenet.json, testnet.json
{
    "code": "W", // or "D" for DecentralChain
    "server": "https://node.decentralchain.io",
    "matcher": "https://matcher.decentralchain.io"
}
```

**React - Missing**:
```typescript
// Need to configure in ConfigContext or similar
const networkConfig = {
    networkByte: 'D'.charCodeAt(0), // DCC mainnet
    nodeUrl: 'https://node.decentralchain.io',
    chainId: 'DecentralChain'
};
```

## Implementation Plan (Priority Order)

### Phase 1: Blockchain Integration (HIGH PRIORITY)
**Files to Update**:
1. `src/hooks/useLedger.ts`
   - Import `@decentralchain/signature-adapter` 
   - Configure DecentralChain network byte
   - Add proper error handling for DCC-specific errors

2. `src/contexts/ConfigContext.tsx`
   - Add network configuration (networkByte, nodeUrl)
   - Pass to Ledger adapter

3. `src/services/multiAccount.ts`
   - Add support for `userType: 'ledger'`
   - Handle Ledger-specific fields in User type
   - Modify `addUser()` to skip seed/privateKey validation for Ledger

### Phase 2: Authentication Integration (HIGH PRIORITY)
**Files to Update**:
1. `src/contexts/AuthContext.tsx`
   - Implement `addLedgerAccount(ledgerUser: LedgerUser, name: string): Promise<User>`
   - Check for duplicate addresses
   - Store Ledger accounts with proper metadata
   - Update `login()` to handle Ledger accounts (no password needed)

2. `src/features/auth/ImportLedger.tsx`
   - Replace temporary hash with `addLedgerAccount()`
   - Handle both first account and additional accounts
   - Remove empty password login

3. `src/types/auth.ts`
   - Add Ledger-specific fields to User type:
     ```typescript
     type User = {
         // ... existing fields
         userType?: 'seed' | 'privateKey' | 'ledger';
         ledgerPath?: string;
         ledgerId?: string;
     };
     ```

### Phase 3: Transaction Signing (MEDIUM PRIORITY)
**Files to Create/Update**:
1. Create `src/hooks/useSignTransaction.ts`
   - Implement transaction signing with Ledger
   - Show confirmation modals
   - Handle device errors

2. Update `src/features/wallet/SendAssetModalModern.tsx`
   - Check if `user.userType === 'ledger'`
   - Show LedgerSignModal during signing
   - Wait for device confirmation

3. Update DEX and Leasing components
   - Apply same signing pattern
   - Handle order creation, cancellation
   - Handle lease start, cancel

### Phase 4: Error Handling & UX Polish (LOW PRIORITY)
**Improvements**:
- Better error messages for device-specific issues
- Timeout handling (25 seconds like Angular)
- Device locked detection
- User rejection handling
- Connection troubleshooting guide

## References

### Official Documentation
- **Ledger Live Wallet API**: https://developers.ledger.com/docs/ledger-live/accounts/getting-started
- **useSignTransaction Hook**: https://developers.ledger.com/docs/ledger-live/discover/integration/wallet-api/react/hooks/useSignTransaction
- **Device Setup**: https://developers.ledger.com/docs/device-interaction/beginner/setup

### Angular Implementation Reference
- `src/modules/ledger/controllers/LedgerCtrl.js` - Account import logic
- `src/modules/user/services/User.js` - User creation with Ledger
- Network configs: `configs/mainnet.json`, `configs/testnet.json`

### DecentralChain Specific
- Network byte: `'D'.charCodeAt(0)` for mainnet
- Node URL: `https://node.decentralchain.io`
- Explorer: `https://explorer.decentralchain.io`

## Testing Checklist

### With Physical Ledger Device
- [ ] Connect Ledger via USB
- [ ] Unlock device with PIN
- [ ] Open DecentralChain app on device
- [ ] Import first account
- [ ] Import additional account
- [ ] Switch between accounts
- [ ] Send transaction (confirm on device)
- [ ] Create DEX order (confirm on device)
- [ ] Cancel DEX order (confirm on device)
- [ ] Start lease (confirm on device)

### Without Device (Error Handling)
- [ ] Show proper error when device not connected
- [ ] Show proper error when device locked
- [ ] Show proper error when wrong app open
- [ ] Handle timeout gracefully
- [ ] Handle user rejection on device

## Next Steps

1. **Review Angular implementation** thoroughly
2. **Update useLedger.ts** to use DecentralChain adapter
3. **Implement addLedgerAccount** in AuthContext
4. **Fix ImportLedger authentication** flow
5. **Test with actual Ledger device**
6. **Implement transaction signing** in wallet/DEX/leasing
7. **Polish error handling** and UX

---

**Status**: 🔴 CRITICAL - Current implementation incomplete and won't work with DecentralChain blockchain
**Estimated Effort**: 2-3 days for Phase 1-2, 1-2 days for Phase 3, 1 day for Phase 4
