import { address, privateKey, randomBytes } from '@waves/ts-lib-crypto';

/**
 * Before running test ensure MASTER_SEED has at least 10 DCC!!
 */
export const MASTER_SEED = 'test acc 2 test acc 2 test acc 2'
export const API_BASE = 'https://testnet-node.decentralchain.io' //3MVCPdW6ZUzLSmMj4RnpZKva1cnTdxQKtNt
export const CHAIN_ID = '!'

export const MATCHER_PUBLIC_KEY = 'DDMFGjv3rCULuVkFywAHebd9mjKZnoQgqPixsSsReqtY'
export const MATCHER_URL = 'https://matcher.decentralchain.io'



export const TIMEOUT = 60000

export const randomHexString = (l: number) => [...randomBytes(l)].map(n => n.toString(16)).join('')
