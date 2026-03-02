import request from '../../tools/request';

// @TODO: When correct API key
// POST /node/stop

export function fetchNodeStatus(
  base: string,
  options: RequestInit = {},
): Promise<INodeStatus> {
  return request({ base, url: '/node/status', options });
}

export function fetchNodeVersion(
  base: string,
  options: RequestInit = {},
): Promise<INodeVersion> {
  return request({ base, url: '/node/version', options });
}

export interface INodeStatus {
  blockchainHeight: number;
  stateHeight: number;
  updatedTimestamp: number;
  updatedDate: string;
}

export interface INodeVersion {
  version: string;
}
