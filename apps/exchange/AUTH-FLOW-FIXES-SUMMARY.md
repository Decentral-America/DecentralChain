# Authentication Flow Fixes - Summary

## Problem
The React app couldn't create accounts due to multiple import resolution errors with `@decentralchain/waves-transactions` package, which has broken ES module exports.

## Root Causes
1. **Broken Package**: `@decentralchain/waves-transactions` has incorrect `main`/`exports` in package.json
2. **Missing Seed.create()**: The Seed class wrapper didn't provide the static `create()` method
3. **Uninitialized Data Service**: The data-service wasn't initialized with network config before use

## Files Fixed

### 1. `/data-service/classes/Seed.ts` ✅
**Problem**: Was just re-exporting the raw Waves Seed, which isn't a class with `.create()` method
**Solution**: Created proper Seed class wrapper matching Angular's `ds.Seed` API:
```typescript
export class Seed {
  static create(words: number = 15): Seed {
    const phrase = randomSeed(words);
    return new Seed(phrase, networkCode);
  }
  
  static fromExistingPhrase(phrase: string, chainId?: number): Seed {
    return new Seed(phrase, chainId || networkCode);
  }
  
  encrypt(password: string, encryptionRounds: number = 5000): string
  static decrypt(encryptedPhrase: string, password: string, encryptionRounds: number = 5000): string
}
```

### 2. `/data-service/api/transactions/parse.ts` ✅
**Problem**: Imported `libs.crypto.base58Decode` from broken package
**Solution**: Changed to use `base58Decode` directly from `@waves/ts-lib-crypto`
```typescript
// Before:
import { libs } from '@decentralchain/waves-transactions';
libs.crypto.base58Decode

// After:
import { base58Decode } from '@waves/ts-lib-crypto';
base58Decode
```

### 3. `/dcc-react/src/config/dataServiceConfig.ts` ✅ (NEW FILE)
**Problem**: Data-service wasn't initialized, causing `null` errors when trying to use `getAssets()`
**Solution**: Created initialization function matching Angular's `AppConfig.js`:
```typescript
export function initializeDataService(): void {
  ds.config.setConfig({
    code: mainnetConfig.code,
    node: mainnetConfig.node,
    matcher: mainnetConfig.matcher,
    api: mainnetConfig.api,              // Critical!
    apiVersion: mainnetConfig.apiVersion, // Critical!
    // ... other configs
  });
}
```

### 4. `/dcc-react/src/main.tsx` ✅
**Problem**: Data-service initialization wasn't called before app startup
**Solution**: Added initialization call before rendering:
```typescript
// Initialize data-service BEFORE anything else (matches Angular AppConfig)
initializeDataService();
```

### 5. `/dcc-react/src/features/auth/ImportAccount.tsx` ✅
**Problem**: Imported Seed from broken package
**Solution**: Changed to use data-service wrapper:
```typescript
// Before:
import { Seed } from '@decentralchain/waves-transactions';

// After:
import { Seed } from 'data-service/classes/Seed';
```

### 6. `/dcc-react/src/features/auth/CreateAccount.tsx` ✅
**Problem**: Already importing from data-service but Seed.create() wasn't available
**Solution**: Fixed by updating Seed class (see #1)

## How the Auth Flow Works Now

### Sign Up (Create New Account)
1. User visits `/signup` page
2. `CreateAccount` component calls `Seed.create()` to generate random 15-word phrase
3. User confirms they've backed up the seed
4. User sets password
5. `AuthContext.create()` is called:
   - Calls `multiAccount.signUp(password)` if first account
   - OR calls `multiAccount.signIn(data, password)` if existing accounts
   - Calls `multiAccount.addUser({ seed, networkByte: 87 })` - **encrypts seed!**
   - Saves to localStorage: `multiAccountData` (encrypted), `multiAccountHash`, `multiAccountUsers`
   - Calls `ds.app.login(userData)` to initialize data-service with user address
6. Navigate to `/desktop/wallet`

### Sign In (Existing Account)
1. User enters password
2. `AuthContext.login()` is called:
   - Calls `multiAccount.signIn(encryptedData, password, rounds, hash)`
   - Verifies password by attempting decryption
   - Gets user from decrypted data
   - Calls `ds.app.login(userData)` to initialize data-service
3. Navigate to `/desktop/wallet`

## Data Service Initialization Flow
```
main.tsx
  ↓
initializeDataService()
  ↓
ds.config.setConfig({
  api: 'https://data-service.decentralchain.io',
  apiVersion: 'v0',
  node: 'https://mainnet-node.decentralchain.io',
  matcher: 'https://mainnet-matcher.decentralchain.io/matcher',
  // ...
})
  ↓
DataServiceClient initialized with API endpoint
  ↓
ds.app.login(userData) when user authenticates
  ↓
dataManager.applyAddress(address) - starts fetching balances, transactions, etc.
```

## Remaining Work (Optional)

### Not Critical for Auth:
- `/dcc-react/src/services/transactionService.ts` - Uses `broadcast` from broken package
  - Solution: Use `broadcast` from `data-service` instead
  - Signature is different, need to adjust usage
  
- `/dcc-react/src/hooks/useTransactionSigning.ts` - Imports transaction types from broken package
  - Solution: Define types locally or use data-service types
  
- `/dcc-react/src/components/wallet/TransactionConfirmationFlow.tsx` - Same as above

These files aren't used during account creation/login, so they don't block the auth flow.

## Testing Checklist

### Sign Up ✅
- [x] Navigate to `/signup`
- [x] See generated seed phrase (15 words)
- [x] Copy seed phrase works
- [x] Enter password (min 8 chars)
- [x] Confirm password
- [x] Check backup confirmation
- [x] Click "Create Wallet"
- [x] Account created and encrypted in localStorage
- [x] Navigate to wallet page

### Sign In ⏳
- [ ] Navigate to `/login` (needs to be implemented)
- [ ] Enter password
- [ ] Successfully decrypt and load account
- [ ] Navigate to wallet page

### Data Service ✅
- [x] `ds.config.getDataService()` returns non-null
- [x] Asset requests work (`ds.app` is not null)
- [x] Transactions can be fetched

## Network Configuration
Using DCC Mainnet (from `/configs/mainnet.json`):
- Network Byte: 87 ('W')
- Node: https://mainnet-node.decentralchain.io
- API: https://data-service.decentralchain.io
- Matcher: https://mainnet-matcher.decentralchain.io/matcher
- Explorer: https://decentralscan.com

## Security Notes
- ✅ Seeds are encrypted with PBKDF2 (5000 rounds) before storage
- ✅ Password is never stored, only kept in memory during session
- ✅ MultiAccount service matches Angular's proven security model
- ✅ Network byte (87) correctly configured for DCC mainnet
- ⚠️ Seeds decrypted in memory when user is signed in (same as Angular)

## Comparison with Angular
The React implementation now matches Angular's architecture:
- Same storage keys: `multiAccountData`, `multiAccountHash`, `multiAccountUsers`
- Same encryption: PBKDF2 with 5000 rounds
- Same Seed API: `Seed.create()`, `Seed.fromExistingPhrase()`
- Same data-service initialization: `ds.config.setConfig()` at startup
- Same login flow: `ds.app.login(userData)`
