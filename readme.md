# @decentralchain/browser-bus

Cross-window browser communication library for DecentralChain DApps and wallet applications.

Enables secure message passing between browser windows, tabs, and iframes using the postMessage API. Used for DApp-to-wallet communication, transaction signing popups, and multi-tab synchronization.

## Installation

```bash
npm install @decentralchain/browser-bus
```

## Usage

### Parent window with iframe

On the parent window side:
```typescript
import { Bus, WindowAdapter } from '@decentralchain/browser-bus';

const url = 'https://some-iframe-content-url.com';
const iframe = document.createElement('iframe');

WindowAdapter.createSimpleWindowAdapter(iframe).then(adapter => {
    const bus = new Bus(adapter);

    bus.once('ready', () => {
        // Received message from iframe
    });
});
iframe.src = url; // Preferably assign the URL after calling WindowAdapter.createSimpleWindowAdapter
document.body.appendChild(iframe);
```

On the iframe side:
```typescript
import { Bus, WindowAdapter } from '@decentralchain/browser-bus';

WindowAdapter.createSimpleWindowAdapter().then(adapter => {
    const bus = new Bus(adapter);

    bus.dispatchEvent('ready', null); // Send message to parent window
});
```

## API

### Bus

Creates a bus instance for sending and receiving events and requests.

Constructor parameters:
- `adapter` — an `Adapter` instance responsible for the messaging protocol implementation
- `timeout` (optional) — default response timeout in milliseconds (default: 5000)

#### `dispatchEvent(name, data)`

Send an event. All connected Bus instances subscribed to this event will receive the message.

```typescript
bus.dispatchEvent('some-event-name', jsonLikeData);
```

#### `request(name, data?, timeout?)`

Send a request to another Bus instance. Returns a Promise that resolves with the response.

Parameters:
- `name` — request method name
- `data` (optional) — data to send with the request
- `timeout` (optional) — response timeout in ms (default: 5000)

```typescript
bus.request('some-method', jsonLikeData, 100).then(data => {
    // data — response from the other Bus
});
```

#### `on(name, handler)`

Subscribe to events.

```typescript
bus.on('some-event', data => {
    // data — event payload
});
```

#### `once(name, handler)`

Subscribe to an event once.

```typescript
bus.once('some-event', data => {
    // data — event payload
});
```

#### `off(eventName?, handler?)`

Unsubscribe from events.

```typescript
bus.off('some-event', handler); // Unsubscribe specific handler from 'some-event'
bus.off('some-event');          // Unsubscribe all handlers from 'some-event'
bus.off(null, handler);         // Unsubscribe handler from all events
bus.off();                      // Unsubscribe from everything
```

#### `registerRequestHandler(name, handler)`

Register a handler for requests from another Bus instance.

```typescript
// In iframe code
bus.registerRequestHandler('get-random', () => Math.random());

// In main application
bus.request('get-random').then(num => {
    // Received response from iframe
});
```

Handlers may also return Promises:

```typescript
bus.registerRequestHandler('get-data', () => Promise.resolve(someData));
```

## License

MIT

