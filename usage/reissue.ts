import { reissue } from '../dist/index'

const seed = 'example seed phrase'

const params = {
  quantity: 10000,
  assetId: 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo',
  reissuable: false,
  //senderPublicKey: 'by default derived from seed',
  //timestamp: Date.now(),
  //fee: 100000000,
  //chainId: 'W'
}

const signedReissueTx = reissue(params, seed)
console.log(signedReissueTx)