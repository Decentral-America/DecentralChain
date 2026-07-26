import request from '../../tools/request';

// NOTE: Requires node API key
// POST /node/stop

export function fetchNodeStatus(base: string, options: RequestInit = {}): Promise<INodeStatus> {
  return request({ base, options, url: '/node/status' });
}

export function fetchNodeVersion(base: string, options: RequestInit = {}): Promise<INodeVersion> {
  return request({ base, options, url: '/node/version' });
}

export interface INodeStatus {
  blockchainHeight: number;
  stateHeight: number;
  updatedTimestamp: number;
  updatedDate: string;
  /**
   * Deployment-specific generation-period length (e.g. mainnet: 10_000, this
   * network's testnet: 3000 — see node-scala `BlockchainSettings.scala:85,152,172,190`).
   * Used by {@link fetchFinalityInfo} to compute generation-period boundaries.
   */
  generationPeriodLength: number;
  /**
   * Present only when the (observational) HotStuff coordinator is enabled and
   * has committed at least one block. Absent when HotStuff is off.
   */
  hotStuffFinalizedHeight?: number;
}

export interface INodeVersion {
  version: string;
}
