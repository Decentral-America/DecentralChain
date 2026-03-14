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
}

export interface INodeVersion {
  version: string;
}
