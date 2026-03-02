# @decentralchain/browser-bus

[![CI](https://github.com/Decentral-America/browser-bus/actions/workflows/ci.yml/badge.svg)](https://github.com/Decentral-America/browser-bus/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@decentralchain/browser-bus)](https://www.npmjs.com/package/@decentralchain/browser-bus)
[![license](https://img.shields.io/npm/l/@decentralchain/browser-bus)](./LICENSE)
[![Node.js](https://img.shields.io/node/v/@decentralchain/browser-bus)](./package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

Cross-window browser communication library for DecentralChain DApps and wallet applications.

Enables secure message passing between browser windows, tabs, and iframes using the `postMessage` API. Used for DApp-to-wallet communication, transaction signing popups, and multi-tab synchronization.

## Requirements

- **Node.js** >= 24
- **npm** >= 10

## Installation

```bash
npm install @decentralchain/browser-bus
```

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
| `npm run lint`              | ESLint                                   |
| `npm run lint:fix`          | ESLint with auto-fix                     |
| `npm run format`            | Format with Prettier                     |
| `npm run validate`          | Full CI validation pipeline              |
| `npm run bulletproof`       | Format + lint fix + typecheck + test     |
| `npm run bulletproof:check` | CI-safe: check format + lint + tc + test |

### Quality Gates

- ESLint with strict TypeScript rules
- Prettier formatting
- 90%+ code coverage thresholds
- Bundle size budget enforcement
- Package export validation (publint + attw)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## Security

See [SECURITY.md](./SECURITY.md) for vulnerability reporting.

## Code of Conduct

See [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

[MIT](./LICENSE)
