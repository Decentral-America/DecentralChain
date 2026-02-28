# @decentralchain/ts-types

Shared TypeScript type definitions for the DecentralChain SDK.

Provides canonical types for transactions, blockchain primitives, chain IDs, data entries, and more.

## Installation

```bash
npm install @decentralchain/ts-types
```

## Usage

```typescript
import {
  TRANSACTION_TYPE,
  Transaction,
  TransferTransaction,
  DataTransaction,
  Long,
} from '@decentralchain/ts-types';
```

## Exported Types

### Transaction Types

- `GenesisTransaction`
- `PaymentTransaction`
- `IssueTransaction`
- `TransferTransaction`
- `ReissueTransaction`
- `BurnTransaction`
- `ExchangeTransaction`
- `LeaseTransaction`
- `CancelLeaseTransaction`
- `AliasTransaction`
- `MassTransferTransaction`
- `DataTransaction`
- `SetScriptTransaction`
- `SponsorshipTransaction`
- `SetAssetScriptTransaction`
- `InvokeScriptTransaction`
- `UpdateAssetInfoTransaction`
- `EthereumTransaction`

### Constants

- `TRANSACTION_TYPE` — enum-like object mapping transaction names to their numeric type IDs
- `DATA_FIELD_TYPE` — enum-like object for data entry types (`integer`, `boolean`, `string`, `binary`)

### Primitives

- `Long` — `string | number`
- `Base64Script`, `Base58Bytes`, `Base64String`
- `Proofs`, `AssetDecimals`
- `DataTransactionEntry`, `MassTransferItem`
- `InvokeScriptCall`, `InvokeScriptPayment`

## Chain IDs

| Network | Byte | Char |
| ------- | ---- | ---- |
| Mainnet | 76   | L    |
| Testnet | 84   | T    |

## License

MIT
