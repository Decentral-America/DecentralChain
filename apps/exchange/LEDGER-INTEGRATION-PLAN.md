# Ledger Hardware Wallet Integration Plan for React App

## Executive Summary

This document outlines the complete plan to integrate Ledger hardware wallet support into the React wallet application, based on the Angular implementation analysis.

---

## 1. Angular Implementation Analysis

### 1.1 Core Architecture

**Primary Files:**
- `src/modules/ledger/controllers/LedgerCtrl.js` - Main Ledger import controller
- `src/modules/utils/modals/loginByDevice/LoginByDeviceCtrl.js` - Device connection modal
- `src/modules/utils/modals/signByDevice/SignByDeviceCtrl.js` - Transaction signing modal
- `src/modules/utils/modals/signDeviceError/signDeviceError.html` - Error handling UI
- `src/modules/utils/modals/ModalManager.js` - Modal orchestration

**Key Dependencies:**
- `@decentralchain/signature-adapter` (v6.1.6) - Contains `LedgerAdapter` class
- `@waves/ledger` (v3.5.1) - Low-level Ledger communication library
- `@ledgerhq/hw-transport-node-hid` (v4.22.0) - USB/HID transport for Electron (desktop only)

**Desktop-Only Feature:**
```html
<div ng-if="isDesktop" class="import-modal__block" ui-sref="ledger">
```
Ledger integration is **desktop-only** in Angular version, using Node.js HID transport injected via Electron preload script.

### 1.2 Import Flow (User Onboarding)

```
1. User clicks "Ledger" on import screen (desktop only)
   ↓
2. LedgerCtrl initializes with LedgerAdapter
   ↓
3. Calls adapter.getUserList(offset, count) with 25-second timeout
   ↓
4. Shows LoginByDevice modal with animated connection UI
   ↓
5. Modal displays 3 animated steps:
   - Connect Ledger device
   - Enter PIN code
   - Open Waves app
   ↓
6. On success: Displays 5 user addresses with avatars
   ↓
7. User can:
   - Navigate pages (5 addresses per page)
   - Jump to specific address ID
   - Select default address (ID 0)
   - Enter custom name
   ↓
8. Click "Login" → Creates user object:
   {
     address: "3P...",
     publicKey: "base58...",
     path: "44'/5741564'/0'/0'/0'",  // Waves derivation path
     id: "0",  // Address index
     userType: "ledger",
     name: "My Ledger",
     networkByte: 87  // 'W' for mainnet
   }
   ↓
9. Navigates to wallet view
```

**Key Implementation Details:**

```javascript
// LedgerCtrl.js - Lines 136-169
getUsers(count) {
    this._runLedgerCommand = 'getUsers';
    this.loading = true;
    this.error = false;

    const countUsers = (count || USERS_COUNT) - 1;
    const promise = utils.timeoutPromise(
        this.adapter.getUserList(this.offset, countUsers), 
        25000
    );

    const modalPromise = this.isInit ?
        Promise.resolve() :
        modalManager.showLoginByDevice(promise, this.adapter.type);

    return Promise.all([promise, modalPromise])
        .then(([users]) => {
            this.isInit = true;
            this.loading = false;
            this.error = false;

            (users || []).forEach(curUser => {
                this._users[curUser.id] = curUser;
            });

            this.showVisibleUsers();
            this.selectUser();
            $scope.$digest();
        })
        .catch((err = {}) => {
            const error = { ...err, count };
            this.loading = false;
            this.error = error;
            // Handle RangeError, disconnection, etc.
        });
}
```

```javascript
// LedgerCtrl.js - Lines 265-283
login() {
    this._runLedgerCommand = 'login';

    const newUser = {
        ...this.selectedUser,
        userType: this.adapter.type,  // "ledger"
        name: this.name,
        networkByte: WavesApp.network.code.charCodeAt(0)
    };

    this._calculateDisabled(true);

    return user.create(newUser, true, true).then(() => {
        $state.go(user.getActiveState('wallet'));
    }).catch(() => {
        this.error = true;
        $scope.$digest();
    });
}
```

### 1.3 Transaction Signing Flow

```
1. User initiates transaction (send, trade, lease, etc.)
   ↓
2. App creates Signable object with transaction data
   ↓
3. Checks user.userType === 'ledger'
   ↓
4. Shows SignByDevice modal
   ↓
5. Modal displays transaction details:
   - Transaction type
   - Amount
   - Recipient (if applicable)
   - Fee
   ↓
6. Calls signable.getSignature()
   ↓
7. LedgerAdapter communicates with device:
   - Serializes transaction
   - Sends to Ledger for user confirmation
   - User reviews on device screen
   - User presses both buttons to confirm
   ↓
8. Device returns signature
   ↓
9. Modal closes, transaction broadcasts
```

**Key Implementation:**

```javascript
// SignByDeviceCtrl.js - Lines 59-94
constructor(signable, anyData) {
    super($scope);
    this.anyData = anyData;
    this.mode = SignByDeviceCtrl.getSignMode(signable.type);

    signable.getId().then(id => {
        this.txId = id;
        $scope.$apply();
    });

    this.txData = signable.getTxData();
    this.parseOrderData();

    if (this.txData.price) {
        this.total = this.txData.price.cloneWithTokens(
            this.txData.price.getTokens().mul(this.txData.amount.getTokens())
        );
    }

    this.isLedger = user.userType === 'ledger';
    this.isKeeper = user.userType === 'wavesKeeper';

    this.deferred.promise()
        .then(signable => {
            this.onLoad(signable);
        })
        .catch(error => {
            this.onError(error);
        });

    signable.getSignature()
        .then(() => {
            this.deferred.resolve(signable);
        })
        .catch(error => {
            this.deferred.reject(error);
        });
}
```

### 1.4 Error Handling

**Common Errors:**
1. **Device not connected** - Shows retry modal with instructions
2. **PIN not entered** - Modal stays open with animation
3. **Waves app not open** - Modal shows "Open Waves app on device"
4. **User rejection** - Shows "Transaction rejected" error
5. **Timeout (25s)** - Shows connection error with retry option
6. **Transport error** - USB disconnection, HID issues

**Error Modal:**
```html
<!-- signDeviceError/signDeviceError.html -->
<div class="sign-error-icon ledger-icons"></div>
<h3 class="text-center basic-700" w-i18n="ledger.connectionError"></h3>
<div class="margin-3 body-2 basic-500">
    <div class="text-center basic-500">
        <span w-i18n="ledger.connectionText"></span>
    </div>
    <div class="text-center basic-500">
        <span w-i18n="ledger.referTo"></span>
        <a href="https://support.ledgerwallet.com/hc/en-us/articles/115005165269-Fix-connection-issues"
            w-i18n="ledger.article" target="_blank" rel="noopener noreferrer"></a>
    </div>
</div>
```

---

## 2. React Implementation Architecture

### 2.1 New Files to Create

```
dcc-react/src/
├── hooks/
│   └── useLedger.ts                    # Core Ledger device management hook
├── contexts/
│   └── LedgerContext.tsx               # Global Ledger state provider
├── features/
│   └── auth/
│       └── ImportLedger.tsx            # Ledger import flow component
├── components/
│   └── modals/
│       ├── LedgerConnectModal.tsx      # Device connection modal
│       ├── LedgerSignModal.tsx         # Transaction signing modal
│       └── LedgerErrorModal.tsx        # Error handling modal
└── utils/
    └── ledger.ts                        # Ledger utility functions
```

### 2.2 Dependencies to Add

Add to `dcc-react/package.json`:

```json
{
  "dependencies": {
    "@ledgerhq/hw-transport-node-hid": "^6.27.0",
    "@waves/ledger": "^3.5.1"
  },
  "devDependencies": {
    "@types/ledgerhq__hw-transport-node-hid": "^4.22.0"
  }
}
```

**Note:** React app will also be **desktop-only** for Ledger support, using Electron's Node.js integration.

### 2.3 Core Hook: `useLedger.ts`

```typescript
// dcc-react/src/hooks/useLedger.ts

import { useState, useCallback, useRef } from 'react';
import { LedgerAdapter } from '@decentralchain/signature-adapter';

interface LedgerUser {
  id: string;
  address: string;
  publicKey: string;
  path: string;
}

interface UseLedgerReturn {
  // State
  isConnected: boolean;
  isLoading: boolean;
  error: Error | null;
  users: LedgerUser[];
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  getUserList: (offset: number, count: number) => Promise<LedgerUser[]>;
  signTransaction: (txData: any) => Promise<string>;
  
  // Lifecycle
  isInitialized: boolean;
}

const TIMEOUT_MS = 25000;

export const useLedger = (): UseLedgerReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [users, setUsers] = useState<LedgerUser[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const adapterRef = useRef<typeof LedgerAdapter>(LedgerAdapter);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const withTimeout = useCallback(<T,>(
    promise: Promise<T>,
    timeoutMs: number = TIMEOUT_MS
  ): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Ledger connection timeout. Please check device.'));
        }, timeoutMs);
      })
    ]).finally(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    });
  }, []);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // LedgerAdapter.isAvailable() checks transport availability
      const available = await withTimeout(
        adapterRef.current.isAvailable()
      );
      
      if (!available) {
        throw new Error('Ledger device not found. Please connect your device.');
      }
      
      setIsConnected(true);
      setIsInitialized(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsConnected(false);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [withTimeout]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setUsers([]);
    setError(null);
  }, []);

  const getUserList = useCallback(async (
    offset: number,
    count: number
  ): Promise<LedgerUser[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userList = await withTimeout(
        adapterRef.current.getUserList(offset, count)
      );
      
      setUsers(userList);
      return userList;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get addresses');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [withTimeout]);

  const signTransaction = useCallback(async (txData: any): Promise<string> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // LedgerAdapter.sign() returns signature
      const signature = await withTimeout(
        adapterRef.current.sign(txData)
      );
      
      return signature;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Transaction rejected');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [withTimeout]);

  return {
    isConnected,
    isLoading,
    error,
    users,
    connect,
    disconnect,
    getUserList,
    signTransaction,
    isInitialized
  };
};
```

### 2.4 Context Provider: `LedgerContext.tsx`

```typescript
// dcc-react/src/contexts/LedgerContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import { useLedger } from '../hooks/useLedger';

interface LedgerContextValue extends ReturnType<typeof useLedger> {}

const LedgerContext = createContext<LedgerContextValue | undefined>(undefined);

export const LedgerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const ledger = useLedger();
  
  return (
    <LedgerContext.Provider value={ledger}>
      {children}
    </LedgerContext.Provider>
  );
};

export const useLedgerContext = (): LedgerContextValue => {
  const context = useContext(LedgerContext);
  if (!context) {
    throw new Error('useLedgerContext must be used within LedgerProvider');
  }
  return context;
};
```

### 2.5 Import Component: `ImportLedger.tsx`

```typescript
// dcc-react/src/features/auth/ImportLedger.tsx

import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLedgerContext } from '../../contexts/LedgerContext';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';
import LedgerConnectModal from '../../components/modals/LedgerConnectModal';
import LedgerErrorModal from '../../components/modals/LedgerErrorModal';
import { User } from '../../types/auth';

const USERS_PER_PAGE = 5;

const ImportLedger: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { networkByte } = useConfig();
  const {
    isConnected,
    isLoading,
    error,
    users,
    connect,
    getUserList,
    isInitialized
  } = useLedgerContext();

  const [offset, setOffset] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string>('0');
  const [customName, setCustomName] = useState('');
  const [useDefaultAddress, setUseDefaultAddress] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [visibleUsers, setVisibleUsers] = useState<typeof users>([]);

  // Initial connection
  useEffect(() => {
    const initConnection = async () => {
      setShowConnectModal(true);
      try {
        await connect();
        await getUserList(0, USERS_PER_PAGE);
        setShowConnectModal(false);
      } catch (err) {
        setShowConnectModal(false);
        setShowErrorModal(true);
      }
    };

    if (!isInitialized) {
      initConnection();
    }
  }, [isInitialized, connect, getUserList]);

  // Update visible users when offset changes
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const userList = await getUserList(offset, USERS_PER_PAGE);
        setVisibleUsers(userList);
        
        if (useDefaultAddress && userList.length > 0) {
          setSelectedUserId(userList[0].id);
        }
      } catch (err) {
        setShowErrorModal(true);
      }
    };

    if (isConnected) {
      loadUsers();
    }
  }, [offset, isConnected, getUserList, useDefaultAddress]);

  const handlePageLeft = () => {
    if (offset >= USERS_PER_PAGE) {
      setOffset(prev => prev - USERS_PER_PAGE);
    }
  };

  const handlePageRight = () => {
    setOffset(prev => prev + USERS_PER_PAGE);
  };

  const handleSelectUser = (userId: string) => {
    if (!useDefaultAddress) {
      setSelectedUserId(userId);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const selectedUser = visibleUsers.find(u => u.id === selectedUserId);
    if (!selectedUser) return;

    try {
      const userData: User = {
        address: selectedUser.address,
        publicKey: selectedUser.publicKey,
        userType: 'ledger',
        ledgerPath: selectedUser.path,
        ledgerId: selectedUser.id,
        name: customName || `Ledger ${selectedUser.id}`,
        networkByte,
      };

      await login(userData);
      navigate('/wallet');
    } catch (err) {
      setShowErrorModal(true);
    }
  };

  const handleRetry = async () => {
    setShowErrorModal(false);
    setShowConnectModal(true);
    try {
      await connect();
      await getUserList(offset, USERS_PER_PAGE);
      setShowConnectModal(false);
    } catch (err) {
      setShowConnectModal(false);
      setShowErrorModal(true);
    }
  };

  if (showConnectModal) {
    return <LedgerConnectModal />;
  }

  if (showErrorModal) {
    return (
      <LedgerErrorModal
        error={error}
        onRetry={handleRetry}
        onCancel={() => navigate('/import')}
      />
    );
  }

  return (
    <Container>
      <Title>Import from Ledger</Title>
      <Subtitle>Choose an address from your Ledger device</Subtitle>

      <AddressCarousel>
        <NavButton onClick={handlePageLeft} disabled={offset === 0 || isLoading}>
          ←
        </NavButton>

        <AddressList>
          {visibleUsers.map((user, index) => (
            <AddressCard
              key={user.id}
              selected={user.id === selectedUserId}
              disabled={useDefaultAddress && index !== 0}
              onClick={() => handleSelectUser(user.id)}
            >
              <Avatar address={user.address} />
              <AddressText>{user.address}</AddressText>
              <AddressId>ID: {user.id}</AddressId>
            </AddressCard>
          ))}
        </AddressList>

        <NavButton onClick={handlePageRight} disabled={isLoading}>
          →
        </NavButton>
      </AddressCarousel>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Address ID</Label>
          <Input
            type="number"
            value={useDefaultAddress ? '0' : selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={useDefaultAddress || isLoading}
            min="0"
          />
        </FormGroup>

        <CheckboxGroup>
          <Checkbox
            type="checkbox"
            checked={useDefaultAddress}
            onChange={(e) => setUseDefaultAddress(e.target.checked)}
            id="default-address"
          />
          <CheckboxLabel htmlFor="default-address">
            Use default address (ID 0)
          </CheckboxLabel>
        </CheckboxGroup>

        <FormGroup>
          <Label>Account Name</Label>
          <Input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="My Ledger Account"
            maxLength={24}
            required
          />
        </FormGroup>

        <SubmitButton type="submit" disabled={isLoading || !customName}>
          {isLoading ? 'Loading...' : 'Import Account'}
        </SubmitButton>
      </Form>
    </Container>
  );
};

export default ImportLedger;

// Styled components...
const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const AddressCarousel = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const NavButton = styled.button`
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid #007bff;
  background: white;
  cursor: pointer;
  font-size: 1.5rem;
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const AddressList = styled.div`
  flex: 1;
  display: flex;
  gap: 1rem;
  overflow-x: auto;
`;

const AddressCard = styled.div<{ selected: boolean; disabled: boolean }>`
  min-width: 140px;
  padding: 1rem;
  border: 2px solid ${props => props.selected ? '#007bff' : '#ddd'};
  border-radius: 8px;
  text-align: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover {
    border-color: ${props => !props.disabled && '#007bff'};
  }
`;

const Avatar = styled.div<{ address: string }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 auto 0.5rem;
`;

const AddressText = styled.div`
  font-size: 0.75rem;
  word-break: break-all;
  margin-bottom: 0.25rem;
`;

const AddressId = styled.div`
  font-size: 0.7rem;
  color: #999;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 600;
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
`;

const CheckboxGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 20px;
  height: 20px;
`;

const CheckboxLabel = styled.label`
  cursor: pointer;
`;

const SubmitButton = styled.button`
  padding: 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  &:hover:not(:disabled) {
    background: #0056b3;
  }
`;
```

### 2.6 Connection Modal: `LedgerConnectModal.tsx`

```typescript
// dcc-react/src/components/modals/LedgerConnectModal.tsx

import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';

const STEPS = [
  {
    image: '/assets/ledger-step1.png',
    text: 'Connect your Ledger device via USB',
    duration: 3000
  },
  {
    image: '/assets/ledger-step2.png',
    text: 'Enter your PIN code on the device',
    duration: 3000
  },
  {
    image: '/assets/ledger-step3.png',
    text: 'Open the Waves application',
    duration: 3000
  }
];

const LedgerConnectModal: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % STEPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const step = STEPS[currentStep];

  return (
    <Overlay>
      <Modal>
        <DeviceImage src={step.image} alt="Ledger device" />
        <Title>Connecting to Ledger</Title>
        <StepText>{step.text}</StepText>
        <Dots>
          <Dot delay="0s" />
          <Dot delay="0.3s" />
          <Dot delay="0.6s" />
        </Dots>
      </Modal>
    </Overlay>
  );
};

export default LedgerConnectModal;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  max-width: 400px;
`;

const DeviceImage = styled.img`
  width: 278px;
  height: 146px;
  margin: 0 auto 2rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
`;

const StepText = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
`;

const Dots = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

const Dot = styled.div<{ delay: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #007bff;
  animation: ${pulse} 1.5s ease-in-out infinite;
  animation-delay: ${props => props.delay};
`;
```

### 2.7 Sign Modal: `LedgerSignModal.tsx`

```typescript
// dcc-react/src/components/modals/LedgerSignModal.tsx

import React from 'react';
import styled from 'styled-components';

interface LedgerSignModalProps {
  txType: string;
  amount?: string;
  recipient?: string;
  fee: string;
}

const LedgerSignModal: React.FC<LedgerSignModalProps> = ({
  txType,
  amount,
  recipient,
  fee
}) => {
  return (
    <Overlay>
      <Modal>
        <DeviceIcon />
        <Title>Confirm on Ledger</Title>
        <Subtitle>Please review and confirm the transaction on your device</Subtitle>

        <TxDetails>
          <DetailRow>
            <DetailLabel>Type:</DetailLabel>
            <DetailValue>{txType}</DetailValue>
          </DetailRow>

          {amount && (
            <DetailRow>
              <DetailLabel>Amount:</DetailLabel>
              <DetailValue>{amount}</DetailValue>
            </DetailRow>
          )}

          {recipient && (
            <DetailRow>
              <DetailLabel>Recipient:</DetailLabel>
              <DetailValue>{recipient}</DetailValue>
            </DetailRow>
          )}

          <DetailRow>
            <DetailLabel>Fee:</DetailLabel>
            <DetailValue>{fee}</DetailValue>
          </DetailRow>
        </TxDetails>

        <Instruction>
          Press both buttons on your Ledger to confirm
        </Instruction>

        <Loader />
      </Modal>
    </Overlay>
  );
};

export default LedgerSignModal;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  max-width: 500px;
`;

const DeviceIcon = styled.div`
  width: 60px;
  height: 60px;
  margin: 0 auto 1.5rem;
  background: url('/assets/ledger-icon.svg') no-repeat center;
  background-size: contain;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const TxDetails = styled.div`
  background: #f5f5f5;
  border-radius: 4px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: left;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
    padding-top: 0.75rem;
    border-top: 1px solid #ddd;
    font-weight: 600;
  }
`;

const DetailLabel = styled.span`
  color: #666;
`;

const DetailValue = styled.span`
  font-weight: 500;
`;

const Instruction = styled.p`
  color: #007bff;
  font-weight: 500;
  margin-bottom: 1.5rem;
`;

const Loader = styled.div`
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
```

### 2.8 Error Modal: `LedgerErrorModal.tsx`

```typescript
// dcc-react/src/components/modals/LedgerErrorModal.tsx

import React from 'react';
import styled from 'styled-components';

interface LedgerErrorModalProps {
  error: Error | null;
  onRetry: () => void;
  onCancel: () => void;
}

const LedgerErrorModal: React.FC<LedgerErrorModalProps> = ({
  error,
  onRetry,
  onCancel
}) => {
  return (
    <Overlay>
      <Modal>
        <ErrorIcon>⚠️</ErrorIcon>
        <Title>Connection Error</Title>
        <Message>{error?.message || 'Failed to connect to Ledger device'}</Message>

        <Instructions>
          <InstructionTitle>Please ensure:</InstructionTitle>
          <InstructionList>
            <li>Your Ledger device is connected via USB</li>
            <li>The device is unlocked (PIN entered)</li>
            <li>The Waves application is open on the device</li>
            <li>Browser support is enabled in Settings</li>
          </InstructionList>
        </Instructions>

        <SupportLink
          href="https://support.ledger.com/hc/en-us/articles/115005165269-Fix-connection-issues"
          target="_blank"
          rel="noopener noreferrer"
        >
          View troubleshooting guide →
        </SupportLink>

        <ButtonGroup>
          <RetryButton onClick={onRetry}>Retry Connection</RetryButton>
          <CancelButton onClick={onCancel}>Go Back</CancelButton>
        </ButtonGroup>
      </Modal>
    </Overlay>
  );
};

export default LedgerErrorModal;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: white;
  border-radius: 8px;
  padding: 2rem;
  max-width: 500px;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  color: #dc3545;
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: #666;
  margin-bottom: 2rem;
`;

const Instructions = styled.div`
  background: #f8f9fa;
  border-radius: 4px;
  padding: 1.5rem;
  text-align: left;
  margin-bottom: 1.5rem;
`;

const InstructionTitle = styled.h3`
  font-size: 1rem;
  margin-bottom: 1rem;
`;

const InstructionList = styled.ul`
  list-style-position: inside;
  
  li {
    margin-bottom: 0.5rem;
    color: #666;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const SupportLink = styled.a`
  display: inline-block;
  color: #007bff;
  text-decoration: none;
  margin-bottom: 2rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
`;

const RetryButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background: #0056b3;
  }
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: white;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  
  &:hover {
    background: #f8f9fa;
  }
`;
```

---

## 3. Integration Points

### 3.1 Update AuthContext

```typescript
// dcc-react/src/contexts/AuthContext.tsx

// Add Ledger fields to User type
export interface User {
  address: string;
  publicKey: string;
  userType: 'seed' | 'privateKey' | 'ledger' | 'keeper';
  encryptedSeed?: string;
  name?: string;
  networkByte: number;
  
  // Ledger-specific fields
  ledgerPath?: string;  // e.g., "44'/5741564'/0'/0'/0'"
  ledgerId?: string;    // Address index
}

// Update login function to support Ledger
const login = async (userData: User) => {
  if (userData.userType === 'ledger') {
    // Validate Ledger-specific fields
    if (!userData.ledgerPath || !userData.ledgerId) {
      throw new Error('Invalid Ledger user data');
    }
  }
  
  // Rest of login logic...
  setUser(userData);
  setIsAuthenticated(true);
  localStorage.setItem('user', JSON.stringify(userData));
};
```

### 3.2 Update App.tsx

```typescript
// dcc-react/src/App.tsx

import { LedgerProvider } from './contexts/LedgerContext';

function App() {
  return (
    <ConfigProvider>
      <LedgerProvider>  {/* Add Ledger provider */}
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* ... existing routes ... */}
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LedgerProvider>
    </ConfigProvider>
  );
}
```

### 3.3 Add Import Route

```typescript
// dcc-react/src/routes/authRoutes.tsx (or wherever routes are defined)

import ImportLedger from '../features/auth/ImportLedger';

// Add route:
{
  path: '/import/ledger',
  element: <ImportLedger />
}
```

### 3.4 Update Import Selection Page

```typescript
// dcc-react/src/features/auth/ImportAccount.tsx (or similar)

// Add Ledger option (show only on desktop)
const isDesktop = window.electron !== undefined;

{isDesktop && (
  <ImportOption onClick={() => navigate('/import/ledger')}>
    <LedgerIcon />
    <Title>Ledger Hardware Wallet</Title>
    <Description>
      Import your account from a Ledger device
    </Description>
  </ImportOption>
)}
```

### 3.5 Transaction Signing Integration

```typescript
// dcc-react/src/utils/transactions.ts

import { useLedgerContext } from '../contexts/LedgerContext';
import { useAuth } from '../contexts/AuthContext';

export const useTransactionSigning = () => {
  const { user } = useAuth();
  const { signTransaction } = useLedgerContext();
  
  const signAndBroadcast = async (txData: any) => {
    let signature: string;
    
    if (user?.userType === 'ledger') {
      // Show LedgerSignModal
      // Wait for device confirmation
      signature = await signTransaction(txData);
    } else if (user?.userType === 'seed') {
      // Use Seed signing
      // ...
    }
    // ... etc
    
    // Broadcast transaction
    return broadcastTransaction({ ...txData, signature });
  };
  
  return { signAndBroadcast };
};
```

---

## 4. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Install dependencies (@ledgerhq/hw-transport-node-hid, @waves/ledger)
- [ ] Create `useLedger.ts` hook with core functionality
- [ ] Create `LedgerContext.tsx` provider
- [ ] Update Electron preload script to inject TransportNodeHid
- [ ] Update User type in AuthContext

### Phase 2: Import Flow (Week 2)
- [ ] Create `ImportLedger.tsx` component
- [ ] Create `LedgerConnectModal.tsx`
- [ ] Create `LedgerErrorModal.tsx`
- [ ] Add `/import/ledger` route
- [ ] Update import selection page with Ledger option
- [ ] Test connection and address derivation

### Phase 3: Transaction Signing (Week 3)
- [ ] Create `LedgerSignModal.tsx`
- [ ] Update transaction utility functions
- [ ] Integrate signing into Send feature
- [ ] Integrate signing into Trading (DEX)
- [ ] Integrate signing into Leasing
- [ ] Handle all transaction types (transfer, data, invoke, etc.)

### Phase 4: Error Handling & Polish (Week 4)
- [ ] Comprehensive error handling (timeout, disconnection, rejection)
- [ ] Loading states and UX polish
- [ ] Add keyboard navigation (ESC to cancel, etc.)
- [ ] Add internationalization (i18n) strings
- [ ] User confirmation prompts
- [ ] Success notifications

### Phase 5: Testing & Documentation (Week 5)
- [ ] Test with physical Ledger device (Nano S, Nano X, Nano S Plus)
- [ ] Test all transaction types
- [ ] Test error scenarios (unplug device, reject tx, timeout)
- [ ] Edge case testing (rapid page navigation, multiple addresses, etc.)
- [ ] Write user documentation
- [ ] Create developer documentation
- [ ] Add troubleshooting guide

---

## 5. Technical Considerations

### 5.1 Desktop-Only Limitation

Ledger integration requires USB HID access, which is only available in Electron (desktop app), not in web browsers. The web version cannot support Ledger.

**Implementation:**
```typescript
// Check if running in Electron
const isDesktop = window.electron !== undefined;

// Only show Ledger option on desktop
{isDesktop && (
  <LedgerOption onClick={handleLedgerImport}>
    Import from Ledger
  </LedgerOption>
)}
```

### 5.2 Waves Derivation Path

Ledger uses BIP44 derivation paths. For Waves/DecentralChain:

```
m/44'/5741564'/0'/0'/[index]'
```

- `44'`: BIP44
- `5741564'`: Waves coin type
- `0'`: Account (always 0)
- `0'`: Change (always 0)
- `[index]'`: Address index (0, 1, 2, ...)

Users can generate multiple addresses by incrementing the index.

### 5.3 Transaction Serialization

The LedgerAdapter handles transaction serialization internally. The app provides high-level transaction data:

```typescript
const txData = {
  type: 4,  // Transfer
  version: 2,
  senderPublicKey: user.publicKey,
  recipient: '3P...',
  amount: 100000000,  // 1 WAVES (8 decimals)
  fee: 100000,
  timestamp: Date.now(),
  attachment: ''
};

const signature = await ledgerAdapter.sign(txData);
```

### 5.4 Device State Management

Ledger devices require careful state management:

1. **Connection State**: Device connected/disconnected
2. **App State**: Waves app open/closed
3. **PIN State**: Device locked/unlocked
4. **Transaction State**: Idle/awaiting confirmation/signing

The `useLedger` hook manages all these states.

### 5.5 Timeout Handling

All Ledger operations have a 25-second timeout to prevent indefinite hangs:

```typescript
const withTimeout = <T,>(promise: Promise<T>, ms: number = 25000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), ms)
    )
  ]);
};
```

### 5.6 Multiple Address Support

Users can import multiple Ledger addresses with different IDs:

- `Ledger Account 0` (default)
- `Ledger Account 1`
- `Ledger Account 5`
- etc.

Each address is a separate "user" in the multi-account system, but all share the same Ledger device.

---

## 6. Security Considerations

### 6.1 Private Key Never Leaves Device

Ledger's security model ensures:
- Private keys never leave the hardware device
- All signing happens on-device
- User must physically confirm transactions

### 6.2 Display Verification

Users must verify transaction details on the Ledger screen:
- Recipient address
- Amount
- Fee

This prevents man-in-the-middle attacks where malware modifies transaction data.

### 6.3 No Seed Storage

Unlike seed phrase auth, Ledger users:
- Never enter their seed phrase in the app
- Don't store encrypted seeds in localStorage
- Rely entirely on the hardware device for signing

### 6.4 Device Detection

Always validate device availability before operations:

```typescript
const isAvailable = await LedgerAdapter.isAvailable();
if (!isAvailable) {
  throw new Error('Device not found');
}
```

---

## 7. User Experience Guidelines

### 7.1 Clear Instructions

Always provide step-by-step instructions:
1. "Connect your Ledger device"
2. "Enter your PIN"
3. "Open the Waves application"

### 7.2 Visual Feedback

Use animations and loading states:
- Pulsing dots during connection
- Rotating loader during signing
- Success checkmark on completion

### 7.3 Error Messages

Provide actionable error messages:
❌ Bad: "Error 0x6b0c"
✅ Good: "Device locked. Please enter your PIN."

### 7.4 Timeout Communication

Inform users about timeouts:
"Waiting for device confirmation... (25 seconds remaining)"

### 7.5 Cancel Options

Allow users to cancel operations:
- ESC key to close modals
- "Cancel" button always visible
- Clear feedback when cancelled

---

## 8. Testing Strategy

### 8.1 Unit Tests
- `useLedger` hook logic
- Timeout handling
- Error scenarios
- State management

### 8.2 Integration Tests
- Connection flow
- Address derivation
- Transaction signing
- Error recovery

### 8.3 E2E Tests with Device
- Full import flow
- Send transaction
- Trade on DEX
- Create alias
- Lease DCC

### 8.4 Error Scenario Tests
- Device unplugged mid-operation
- User rejects transaction
- App closed on device
- Timeout scenarios
- Multiple rapid requests

---

## 9. Documentation Deliverables

### 9.1 User Documentation
- "How to connect your Ledger"
- "Importing addresses from Ledger"
- "Signing transactions with Ledger"
- "Troubleshooting Ledger issues"

### 9.2 Developer Documentation
- Ledger integration architecture
- API reference for `useLedger` hook
- Testing guide
- Common pitfalls and solutions

---

## 10. Success Criteria

✅ User can import Ledger addresses on desktop app
✅ All 5 addresses visible with navigation
✅ Custom address ID selection works
✅ Transactions signed with device confirmation
✅ All transaction types supported (transfer, trade, lease, etc.)
✅ Error handling covers all edge cases
✅ Modals provide clear feedback
✅ 25-second timeout prevents hangs
✅ Works with Nano S, Nano X, Nano S Plus
✅ Comprehensive documentation available

---

## Appendix: Angular vs React Comparison

| Feature | Angular Implementation | React Implementation |
|---------|----------------------|---------------------|
| **Ledger Library** | `@decentralchain/signature-adapter` LedgerAdapter | Same - LedgerAdapter |
| **Transport** | `@ledgerhq/hw-transport-node-hid` v4.22.0 | `@ledgerhq/hw-transport-node-hid` v6.27.0 (updated) |
| **State Management** | Angular controller properties | React hooks (`useState`, `useRef`) |
| **Modals** | Angular Material `$mdDialog` | Styled-components + React portals |
| **Routing** | UI-Router `ui-sref` | React Router `navigate()` |
| **User Storage** | Angular `user` service | React `AuthContext` |
| **Timeout** | `utils.timeoutPromise()` | Custom `withTimeout()` wrapper |
| **Address Pagination** | Controller offset state | React state + `useEffect` |

---

## Conclusion

This plan provides a complete roadmap for integrating Ledger hardware wallet support into the React application. The implementation closely mirrors the Angular version's functionality while adapting to React's patterns and best practices.

**Key Takeaways:**
1. Desktop-only feature (Electron required)
2. Uses existing `@decentralchain/signature-adapter` library
3. 5-week implementation timeline
4. Comprehensive error handling required
5. Security-first approach (on-device signing)
6. User-friendly connection flow with visual feedback

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1: Foundation setup
3. Procure Ledger devices for testing
4. Schedule milestone reviews

