import { order } from '../dist/index'

const seed = 'example seed phrase'

const params = {
  amount: 100000000, //1 dcc
  price: 10, //for 0.00000010 BTC
  priceAsset: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
  matcherPublicKey: 'DDMFGjv3rCULuVkFywAHebd9mjKZnoQgqPixsSsReqtY',
  orderType: 'buy',
}

const signedOrder = order(params as any, seed)
console.log(JSON.stringify(signedOrder))