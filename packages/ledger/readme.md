# @decentralchain/ledger

[![CI](https://github.com/Decentral-America/ledger/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/ledger/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/ledger)](https://www.npmjs.com/package/@decentralchain/ledger)
[![license](https://img.shields.io/npm/l/@decentralchain/ledger)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/ledger)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

DecentralChain Ledger hardware wallet integration library.

Communicate with Ledger Nano S/X devices to derive public keys and sign transactions securely on the hardware device. Supports WebUSB, Web Bluetooth, and Node HID transports.

## Requirements

- **Node.js** >= 22
- A Ledger Nano S or Nano X with the DCC application installed
- A compatible transport (`@ledgerhq/hw-transport-webusb`, `@ledgerhq/hw-transport-web-ble`, etc.)

## Installation

```bash
npm install @decentralchain/ledger
```

You also need a Ledger transport package:

```bash
npm install @ledgerhq/hw-transport-webusb
```

## Quick Start

```typescript
import { DCCLedger } from '@decentralchain/ledger';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

const ledger = new DCCLedger({ transport: TransportWebUSB });
await ledger.tryConnect();

// Get public key and address for account 0
const user = await ledger.getUserDataById(0);
console.log(user.address, user.publicKey);

// Sign a transaction
const signature = await ledger.signTransaction(0, {
  dataBuffer: transactionBytes,
  dataType: 4,
  dataVersion: 2,
});
```

## API Reference

### `new DCCLedger(options)`

Create a new Ledger integration instance.

| Option            | Type                     | Default | Description                                      |
| ----------------- | ------------------------ | ------- | ------------------------------------------------ |
| `transport`       | `LedgerTransportFactory` | —       | **Required.** A `@ledgerhq/hw-transport-*` class |
| `debug`           | `boolean`                | `false` | Enable binary exchange logging                   |
| `openTimeout`     | `number`                 | —       | Connection timeout (ms)                          |
| `listenTimeout`   | `number`                 | —       | Listen request timeout (ms)                      |
| `exchangeTimeout` | `number`                 | —       | Exchange call timeout (ms)                       |
| `networkCode`     | `number`                 | `76`    | DCC network code (76 = mainnet)                  |

### `tryConnect(): Promise<void>`

Connect (or reconnect) to the Ledger device.

### `disconnect(): Promise<void>`

Close the active transport connection.

### `probeDevice(): Promise<boolean>`

Returns `true` if the device is connected and the DCC app is open.

### `getUserDataById(id: number): Promise<User>`

Derive wallet data for an account index.

Returns `{ id, path, address, publicKey, statusCode }`.

### `getVersion(): Promise<number[]>`

Query the installed DCC application version (`[major, minor, patch]`).

### `getPaginationUsersData(from: number, limit: number): Promise<User[]>`

Retrieve wallet data for a range of consecutive account indices.

### `signTransaction(userId, data): Promise<string>`

Sign a transaction. The Ledger device displays parsed transaction details.

### `signOrder(userId, data): Promise<string>`

Sign an exchange order.

### `signSomeData(userId, data): Promise<string>`

Sign arbitrary data bytes (device shows raw data warning).

### `signRequest(userId, data): Promise<string>`

Sign a request payload.

### `signMessage(userId, message): Promise<string>`

Sign an ASCII text message.

All signing methods return a Base58-encoded signature string.

### `getLastError(): unknown`

Return the last error from a Ledger operation, or `null`.

### `getPathById(id: number): string`

Build the BIP-44 derivation path for an account index.

## Supported Transports

- [@ledgerhq/hw-transport-webusb](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-webusb) — Chrome/Edge WebUSB
- [@ledgerhq/hw-transport-web-ble](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-web-ble) — Web Bluetooth
- [@ledgerhq/hw-transport-node-hid](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-node-hid) — Node.js USB HID
- [@ledgerhq/hw-transport-http](https://github.com/LedgerHQ/ledger-live/tree/develop/libs/ledgerjs/packages/hw-transport-http) — HTTP proxy

## Development

### Prerequisites

- **Node.js** >= 22 (24 recommended — see `.node-version`)
- **npm** >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/ledger.git
cd ledger
npm install
```

### Scripts

| Command                     | Description                              |
| --------------------------- | ---------------------------------------- |
| `npm run build`             | Build distribution files                 |
| `npm test`                  | Run tests with Vitest                    |
| `npm run test:watch`        | Tests in watch mode                      |
| `npm run test:coverage`     | Tests with V8 coverage                   |
| `npm run typecheck`         | TypeScript type checking                 |
| `npm run lint`              | ESLint                                   |
| `npm run lint:fix`          | ESLint with auto-fix                     |
| `npm run format`            | Format with Prettier                     |
| `npm run validate`          | Full CI validation pipeline              |
| `npm run bulletproof`       | Format + lint fix + typecheck + test     |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test |

### Quality Gates

- TypeScript strict mode with all strict flags enabled
- ESLint with type-aware rules
- Prettier formatting enforced
- 90% code coverage thresholds
- Bundle size budget (10 kB gzipped)
- Package export validation (publint + attw)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

See [SECURITY.md](./SECURITY.md).

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)
