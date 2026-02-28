# @decentralchain/ledger

JavaScript interface for Ledger hardware wallet integration with DecentralChain.

Communicates with Ledger Nano S/X devices to derive public keys and sign transactions securely on the hardware device.

## Installation

```bash
npm install @decentralchain/ledger
```

## Usage

### Create connection

```typescript
import { DCCLedger } from '@decentralchain/ledger';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

const transport = await TransportWebUSB.create();
const ledger = new DCCLedger({ transport });
```

`DCCLedger` accepts optional arguments:

```typescript
import TransportNodeHid from '@ledgerhq/hw-transport-node-u2f';

const options = {
    debug: true,           // boolean - enable binary exchange logs
    openTimeout: 3000,     // number - ms to wait for connection
    listenTimeout: 30000,  // number - ms to wait for listen request
    exchangeTimeout: 30000,// number - ms timeout for exchange call
    networkCode: 76,       // number - DCC network code (76 for mainnet)
    transport: TransportNodeHid
};

const ledger = new DCCLedger(options);
```

### Where:
- `debug` — enable or disable logs of the binary exchange
- `openTimeout` — delay in ms for waiting connection
- `listenTimeout` — delay in ms for waiting listen request to U2F device
- `exchangeTimeout` — timeout in ms for the exchange call
- `networkCode` — DCC network code (76 for mainnet)
- `transport` — U2F Transport implementation (hw-transport-u2f by default)
  - [@ledgerhq/hw-transport-u2f](https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-transport-u2f)
  - [@ledgerhq/hw-transport-webusb](https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-transport-webusb)
  - [@ledgerhq/hw-transport-web-ble](https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-transport-web-ble)
  - [@ledgerhq/hw-transport-http](https://github.com/LedgerHQ/ledgerjs/tree/master/packages/hw-transport-http)

[Read about transport](https://github.com/LedgerHQ/ledgerjs)

## DCCLedger API

### probeDevice

`probeDevice(): Promise<boolean>` — Returns true if device is available and ready.

```js
const canIUse = async () => {
    return await ledger.probeDevice();
};
```

### tryConnect

`tryConnect(): Promise<void>` — Reconnect to Transport and initialize ledger libs.

```js
const isLedgerReady = async () => {
    try {
        return await ledger.tryConnect();
    } catch (e) {
        // error handlers
    }
};
```

### getUserDataById

`getUserDataById(id): Promise<user>` — Get user from ledger.

User object: `{ id: number, path: string, address: string, publicKey: string }`

- `id` — number from 0
- `path` — string in internal ledger format
- `address` — string in base58 format
- `publicKey` — string in base58 format

```js
ledger.getUserDataById(id)
    .then(
        (user) => { /* ... */ },
        (err) => { /* ... */ }
    );
```

### signTransaction

Sign DCC transaction bytes (ledger shows detailed transaction info).

```js
ledger.signTransaction(userId, data)
```

- `userId` — number
- `data` — transaction data with `dataBuffer`, `dataType`, `dataVersion`

Result is Promise with signature string in base58 format.

### signSomeData

Sign any bytes (ledger can't show detail info).

```js
ledger.signSomeData(userId, data)
```

### signRequest

Sign any bytes (ledger can't show detail info).

```js
ledger.signRequest(userId, data)
```

### signMessage

Sign any string (ledger can't show detail info).

```js
ledger.signMessage(userId, message)
```

Result is Promise with signature string in base58 format.

## Requirements

- Ledger Nano S or Ledger Nano X with the DCC app installed
- Chrome/Edge browser with WebUSB support, or Node.js with USB library

## License

MIT
