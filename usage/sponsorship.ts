import { sponsorship } from '../dist/index'

const seed = 'example seed phrase'

const params = {
  assetId: 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo',
  minSponsoredAssetFee: 100,
  //senderPublicKey: 'by default derived from seed',
  //timestamp: Date.now(),
  //fee: 100000,
  //chainId: 'W',
}

const signedSponsorshipTx = sponsorship(params, seed)
console.log(signedSponsorshipTx)