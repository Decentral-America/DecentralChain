# waves-parse-serialize

This library is used to parse and serialize data in Waves blockchain.

### Includes:
- Serialization primitives
- Parsing primitives
- Binary to js converters
- Js to binary converters
- JSON to js converters
- Js to JSON converters

### Usage:
```javascript
import { binary } from 'parse-serialize'

const bytes = binary.serializeTx({
       type: 10,
       version: 2,
       fee: 100000,
       senderPublicKey: '7GGPvAPV3Gmxo4eswmBRLb6bXXEhAovPinfcwVkA2LJh',
       timestamp: 1542539421565,
       id: '1bVuFdMbDAk6dhcQFfJFxpDjmm8DdFnnKesQ3wpxj7P',
       proofs:
         ['5cW1Ej6wFRK1XpMm3daCWjiSXaKGYfL7bmspZjzATXrNYjRVxZJQVJsDU7ZVcxNXcKJ39fhjxv3rSu4ovPT3Fau8'],
       alias: 'MyTestAlias'
     });

const tx = binary.parseTx(bytes)
```