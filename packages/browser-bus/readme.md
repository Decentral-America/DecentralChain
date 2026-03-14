<p align="center">
  <a href="https://decentralchain.io">
    <img src="https://avatars.githubusercontent.com/u/75630395?s=200" alt="DecentralChain" width="80" />
  </a>
</p>

<h3 align="center">@decentralchain/browser-bus</h3>

<p align="center">
  Cross-window browser communication library for DecentralChain DApps and wallet applications.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@decentralchain/browser-bus"><img src="https://img.shields.io/npm/v/@decentralchain/browser-bus?color=blue" alt="npm" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/npm/l/@decentralchain/browser-bus" alt="license" /></a>
  <a href="https://bundlephobia.com/package/@decentralchain/browser-bus"><img src="https://img.shields.io/bundlephobia/minzip/@decentralchain/browser-bus" alt="bundle size" /></a>
  <a href="./package.json"><img src="https://img.shields.io/node/v/@decentralchain/browser-bus" alt="node" /></a>
</p>

---

## Overview

Enables secure message passing between browser windows, tabs, and iframes using the `postMessage` API. Used for DApp-to-wallet communication, transaction signing popups, and multi-tab synchronization.

**Part of the [DecentralChain](https://docs.decentralchain.io) SDK.**

## Installation

```bash
npm install @decentralchain/browser-bus
```

> Requires **Node.js >= 24** and an ESM environment (`"type": "module"`).

## Quick Start

### Parent window with iframe

```typescript
import { Bus, WindowAdapter } from '@decentralchain/browser-bus';

const url = 'https://some-iframe-content-url.com';
const iframe = document.createElement('iframe');

WindowAdapter.createSimpleWindowAdapter(iframe).then((adapter) => {
  const bus = new Bus(adapter);

  bus.once('ready', () => {
    // Received message from iframe
  });
});
iframe.src = url;
document.body.appendChild(iframe);
```

### Iframe side

```typescript
import { Bus, WindowAdapter } from '@decentralchain/browser-bus';

WindowAdapter.createSimpleWindowAdapter().then((adapter) => {
  const bus = new Bus(adapter);

  bus.dispatchEvent('ready', null);
});
```

## API Reference

### `Bus`

Creates a bus instance for sending and receiving events and requests.

**Constructor:**

- `adapter` — an `Adapter` instance for the messaging transport
- `timeout` (optional) — default response timeout in milliseconds (default: 5000)

#### `dispatchEvent(name, data)`

Send an event to all connected Bus instances.

```typescript
bus.dispatchEvent('some-event-name', jsonLikeData);
```

#### `request(name, data?, timeout?)`

Send a request and receive a response. Returns a `Promise`.

```typescript
const result = await bus.request('some-method', jsonLikeData, 100);
```

#### `on(name, handler)`

Subscribe to an event.

```typescript
bus.on('some-event', (data) => {
  // handle event
});
```

#### `once(name, handler)`

Subscribe to an event once.

```typescript
bus.once('some-event', (data) => {
  // fires only once
});
```

#### `off(eventName?, handler?)`

Unsubscribe from events.

```typescript
bus.off('some-event', handler); // Unsubscribe specific handler
bus.off('some-event'); // Unsubscribe all from 'some-event'
bus.off(); // Unsubscribe from everything
```

#### `registerRequestHandler(name, handler)`

Register a handler for incoming requests.

```typescript
bus.registerRequestHandler('get-random', () => Math.random());
```

Handlers may return Promises:

```typescript
bus.registerRequestHandler('get-data', () => Promise.resolve(someData));
```

### `WindowAdapter`

Adapter implementation for cross-window communication via `postMessage`.

#### `WindowAdapter.createSimpleWindowAdapter(iframe?, options?)`

Factory method that creates a `WindowAdapter` for simple parent/iframe communication.

### `Adapter`

Abstract base class for custom transport implementations.

## Development

### Prerequisites

- **Node.js** >= 24 (see `.node-version`)
- **npm** >= 10

### Setup

```bash
git clone https://github.com/Decentral-America/browser-bus.git
cd browser-bus
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
| `npm run lint`              | Biome lint |
| `npm run lint:fix`          | Biome lint with auto-fix                     |
| `npm run format`            | Format with Biome                     |
| `npm run validate`          | Full CI validation pipeline              |
| `npm run bulletproof`       | Format + lint fix + typecheck + test     |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test |

### Quality Gates

- Biome with strict TypeScript rules
- Biome formatting
- 90%+ code coverage thresholds
- Bundle size budget enforcement
- Package export validation (publint + attw)

## Related packages

| Package | Description |
| --- | --- |
| [`@decentralchain/signer`](https://www.npmjs.com/package/@decentralchain/signer) | Transaction signing orchestrator |
| [`@decentralchain/cubensis-connect-provider`](https://www.npmjs.com/package/@decentralchain/cubensis-connect-provider) | CubensisConnect wallet provider |
| [`@decentralchain/signature-adapter`](https://www.npmjs.com/package/@decentralchain/signature-adapter) | Multi-provider signing adapter |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

To report a vulnerability, see [SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) — Copyright (c) [DecentralChain](https://decentralchain.io)
