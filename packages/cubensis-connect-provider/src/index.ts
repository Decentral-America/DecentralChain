/**
 * @module @decentralchain/provider-cubensis
 *
 * CubensisConnect browser wallet provider for DCC Signer.
 *
 * @example
 * ```ts
 * import { ProviderCubensis } from '@decentralchain/provider-cubensis';
 * import { Signer } from '@decentralchain/signer';
 *
 * const signer = new Signer({ NODE_URL: 'https://mainnet-node.decentralchain.io' });
 * signer.setProvider(new ProviderCubensis());
 * const user = await signer.login();
 * ```
 */

export { ProviderCubensis } from './ProviderCubensis';
export { TRANSACTION_TYPE } from './transaction-type';
export type { TransactionType, TransactionMap } from './transaction-type';
