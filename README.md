# @decentralchain/data-entities

Domain model classes for DecentralChain blockchain entities.

Provides rich, typed entity classes including Asset, Money, OrderPrice, AssetPair, and Candle with built-in arithmetic, validation, and formatting.

## Installation

```bash
npm install @decentralchain/data-entities
```

## Dependencies

- `@decentralchain/bignumber` — precision arithmetic for blockchain amounts

## Usage

```typescript
import { Money, Asset } from '@decentralchain/data-entities';

const dcc = new Asset({
  id: '',
  name: 'DCC',
  precision: 8,
  description: 'DecentralChain native token',
  height: 1,
  timestamp: new Date(),
  sender: '',
  quantity: 10000000000000000,
  reissuable: false,
});

const amount = Money.fromTokens(1.5, dcc);
console.log(amount.toTokens()); // "1.50000000"
console.log(amount.toCoins());  // "150000000"
```

## API

### Asset

Represents a blockchain token with metadata (name, decimals, description, etc).

```typescript
const asset = new Asset({ id, name, precision, description, height, timestamp, sender, quantity, reissuable });
asset.toJSON();
asset.toString(); // returns asset id
Asset.isAsset(obj); // type guard
```

### Money

Amount + Asset pair with full arithmetic operations.

```typescript
const money = Money.fromTokens(100, asset);
money.toTokens();   // "100.00000000"
money.toCoins();    // "10000000000"
money.toFormat();   // formatted string

// Arithmetic
money.add(otherMoney);
money.sub(otherMoney);
money.times(otherMoney);
money.div(otherMoney);

// Comparisons
money.eq(otherMoney);
money.lt(otherMoney);
money.gt(otherMoney);

// Conversion
money.convertTo(otherAsset, exchangeRate);

// Static constructors
Money.fromTokens(count, asset);
Money.fromCoins(count, asset);
```

### OrderPrice

DEX order pricing with precision handling.

```typescript
const price = OrderPrice.fromTokens('1.5', assetPair);
price.toTokens();
price.toMatcherCoins();
price.toFormat();
```

### AssetPair

Represents a trading pair of two assets.

```typescript
const pair = new AssetPair(amountAsset, priceAsset);
pair.precisionDifference;
pair.toJSON();
```

### Candle

OHLCV candle data for charting.

```typescript
const candle = new Candle({ time, open, close, high, low, volume, quoteVolume, weightedAveragePrice, maxHeight, txsCount });
candle.toJSON();
```

### config

Configuration namespace for remapping asset and candle data.

```typescript
import { config } from '@decentralchain/data-entities';

config.set('remapAsset', (data) => ({ ...data, name: data.name.toUpperCase() }));
```

## License

Apache-2.0
