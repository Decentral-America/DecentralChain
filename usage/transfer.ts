import { transfer } from '../dist/index'

const seed = 'example seed phrase'

//Transfering 1 WAVES
const params = {
  amount: 100000000,
  recipient: '3DUM611HQFwQcCQDQnA5W92Xs219smEHaaP',
  //feeAssetId: undefined
  //assetId: undefined
  //attachment: undefined
  //senderPublicKey: 'by default derived from seed',
  //timestamp: Date.now(),
  //fee: 100000,
}

const signedTransferTx = transfer(params, seed)
console.log(signedTransferTx)