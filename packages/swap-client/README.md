# @decentralchain/swap-client

WebSocket client for the DecentralChain token swap aggregator — get the best swap prices across multiple DEX vendors.

## Installation

```sh
npm install @decentralchain/swap-client
```

## Usage

```typescript
import { SwapClient, SwapClientErrorCode } from '@decentralchain/swap-client';

const swapClient = new SwapClient();

// Subscribe to receive swap data
const unsubscribe = swapClient.subscribe({
  onError: () => {
    console.error('Could not connect to the swap service');
  },
  onData: (vendor, response) => {
    if (response.type === 'error') {
      switch (response.code) {
        case SwapClientErrorCode.UNAVAILABLE:
          console.log(`${vendor} is unavailable`);
          break;
        case SwapClientErrorCode.INVALID_ASSET_PAIR:
          console.log(`${vendor} does not support this asset pair`);
          break;
        default:
          console.log(`${vendor} error: ${response.code}`);
      }
      return;
    }

    console.log(`${vendor} swap offer:`, {
      amount: response.amountCoins,
      minimumReceived: response.minimumReceivedCoins,
      priceImpact: response.priceImpact,
      transaction: response.tx,
    });
  },
});

// Set swap parameters
swapClient.setSwapParams({
  amountCoins: '100000000', // 1 WAVES in coins
  fromAssetId: 'WAVES',
  toAssetId: 'DG2xFkPdDwKUoBkzGAhQtLpSGzfXLiCYPEzeKH2Ad24p',
  slippageTolerance: 1, // 0.1%
});

// When done
unsubscribe();
```

### Custom Endpoint

```typescript
const swapClient = new SwapClient({
  wsUrl: 'wss://your-swap-backend.example.com/v2',
});
```

### Lifecycle Management

```typescript
const client = new SwapClient();

// ... use the client ...

// Clean up when done — closes WebSocket, clears timers, rejects future calls
client.destroy();
```

### Multiple Asset Pairs

Create separate instances for each asset pair:

```typescript
const client1 = new SwapClient();
const client2 = new SwapClient();
```

## API

### `new SwapClient(options?)`

Creates a new swap client instance.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wsUrl` | `string` | `wss://swap.decentralchain.io/v2` | WebSocket endpoint URL |
| `connectTimeoutMs` | `number` | `15000` | Connection timeout in milliseconds |
| `maxReconnectAttempts` | `number` | `10` | Maximum reconnection attempts with exponential backoff |

### `swapClient.setSwapParams(params)`

Set the swap parameters. Triggers a new price request.

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `amountCoins` | `string` | Yes | Amount in smallest denomination |
| `fromAssetId` | `string` | Yes | Source asset ID (`'WAVES'` for native token) |
| `toAssetId` | `string` | Yes | Target asset ID |
| `slippageTolerance` | `number` | Yes | Slippage tolerance (1 = 0.1%) |
| `address` | `string` | No | Recipient address |
| `referrer` | `string` | No | Referrer address |

### `swapClient.subscribe(subscriber)`

Subscribe to swap responses. Returns an unsubscribe function.

```typescript
interface Subscriber {
  onError: () => void;
  onData: (vendor: string, response: SwapClientResponse) => void;
}
```

### `SwapClientResponse`

Discriminated union — either an error or data:

```typescript
// Error
{ type: 'error', code: SwapClientErrorCode }

// Success
{
  type: 'data',
  amountCoins: string,
  minimumReceivedCoins: string,
  originalAmountCoins: string,
  originalMinimumReceivedCoins: string,
  priceImpact: number,
  swapParams: SwapParams,
  tx: SwapClientInvokeTransaction,
}
```

### `swapClient.destroy()`

Permanently shuts down the client. Closes the WebSocket, clears all timers, and rejects future `subscribe()` / `setSwapParams()` calls.

### `swapClient.isConnected`

Read-only boolean — `true` when the WebSocket is open.

### `swapClient.isDestroyed`

Read-only boolean — `true` after `destroy()` has been called.

### `SwapClientErrorCode`

| Code | Value | Description |
|------|-------|-------------|
| `UNAVAILABLE` | 0 | Vendor is unavailable |
| `UNEXPECTED` | 1 | Unexpected error |
| `INVALID_ASSET_PAIR` | 2 | Asset pair not supported |
| `INVALID_ARGUMENTS` | 3 | Invalid arguments |

## Reliability

- **Connection timeout**: Configurable via `connectTimeoutMs` (default 15 s). If the WebSocket doesn't open in time, it's closed and reconnection is attempted.
- **Exponential backoff**: Reconnection delays double on each attempt (1 s → 2 s → 4 s → ... → 30 s cap).
- **Max reconnect attempts**: Configurable via `maxReconnectAttempts` (default 10). After exhausting attempts, `onError` is called and no further reconnections are made.
- **Graceful error handling**: Malformed protobuf responses are logged and discarded — they never crash the process.
- **Cross-platform binary encoding**: Binary values are encoded using `Buffer` (Node.js) with `btoa` fallback (browser).

## Protobuf Schema

The wire protocol uses Protocol Buffers. The schema source lives at `src/messages.proto` and is compiled to static JS/TS modules. To recompile after modifying the schema:

```sh
npm run generate:all
```

## License

[MIT](./LICENSE) © DecentralChain
