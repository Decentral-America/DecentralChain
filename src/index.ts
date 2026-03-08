/**
 * @module @decentralchain/cubensis-connect-provider
 *
 * CubensisConnect browser wallet provider for DCC Signer.
 *
 * @example
 * ```ts
 * import { ProviderCubensis } from '@decentralchain/cubensis-connect-provider';
 * import { Signer } from '@decentralchain/signer';
 *
 * const signer = new Signer({ NODE_URL: 'https://mainnet-node.decentralchain.io' });
 * signer.setProvider(new ProviderCubensis());
 * const user = await signer.login();
 * ```
 */

export { ProviderCubensis } from './ProviderCubensis';
export type { TransactionMap, TransactionType } from './transaction-type';
export { TRANSACTION_TYPE } from './transaction-type';
