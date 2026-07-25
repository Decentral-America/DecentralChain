import { type TLong } from '../../interface';
import request from '../../tools/request';

/**
 * GET /activation/status
 * Status
 * @param base
 * @param options
 */

export function fetchActivationStatus(
  base: string,
  options: RequestInit = {},
): Promise<IActivationStatus<TLong>> {
  return request({
    base,
    options,
    url: '/activation/status',
  });
}

/**
 * Get the activation height for a single feature by its numeric id, from
 * `GET /activation/status` (see {@link fetchActivationStatus}).
 *
 * Returns `undefined` when the feature id is unknown to the node, or known
 * but not yet activated (node-scala only populates `activationHeight` once
 * `blockchainStatus` reaches `Activated` — see node-scala's
 * `FeatureActivationStatus.scala` / `ActivationApiRoute.scala`).
 * @param base
 * @param featureId
 * @param options
 */
export function fetchFeatureActivationHeight(
  base: string,
  featureId: number,
  options: RequestInit = {},
): Promise<number | undefined> {
  return fetchActivationStatus(base, options).then(
    (status) => status.features.find((feature) => feature.id === featureId)?.activationHeight,
  );
}

export interface IActivationStatus<LONG> {
  height: number;
  votingInterval: number;
  votingThreshold: number;
  nextCheck: LONG;
  features: IFeatures<TLong>[];
}

export interface IFeatures<_LONG> {
  id: number;
  description: string;
  blockchainStatus: string;
  nodeStatus: string;
  activationHeight?: number;
  supportingBlocks?: number;
}
