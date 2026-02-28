# @decentralchain/parse-json-bignumber

Safe JSON parser that preserves precision for large numbers. Used by the DecentralChain SDK to prevent precision loss when parsing blockchain transaction data.

Standard `JSON.parse()` silently corrupts large integers (numbers larger than `Number.MAX_SAFE_INTEGER`). This library provides custom `JSON.parse()` and `JSON.stringify()` that handle BigNumber values safely.

## Installation

```bash
npm install @decentralchain/parse-json-bignumber
```

## Usage

```javascript
import * as create from '@decentralchain/parse-json-bignumber/dist/parse-json-bignumber';

const { parse, stringify } = create();

// Safe parsing — large numbers are preserved as strings
const data = parse('{"amount": 10000000000000000}');

// Safe stringification
const json = stringify(data);
```

### Custom BigNumber support

```javascript
import BigNumber from 'bignumber.js';

const { parse, stringify } = create({
  strict: false,
  parse: (long) => new BigNumber(long),
  stringify: (long) => long.toFixed(),
  isInstance: (some) => some && (some instanceof BigNumber || BigNumber.isBigNumber(some)),
});

const data = parse('{"amount": 99999999999999999999999999}');
// data.amount is a BigNumber instance
```

## License

MIT
