import { order } from '../dist/index'

const seed = 'example seed phrase'

const params = {
  amount: 100000000, //1 waves
  price: 10, //for 0.00000010 BTC
  priceAsset: 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo',
  matcherPublicKey: 'BWK6Avs2WV1Tj8YMifGYZ5iChvw3wqwepjvxp6np57T1',
  orderType: 'buy',
}

const signedOrder = order(params as any, seed)
console.log(JSON.stringify(signedOrder))