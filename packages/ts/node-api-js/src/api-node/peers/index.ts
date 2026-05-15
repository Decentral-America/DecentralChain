import { type TLong } from '../../interface';
import request from '../../tools/request';

/**
 * GET /peers/all
 * Peer list
 */
export function fetchAll(base: string, options: RequestInit = {}): Promise<IAllResponse> {
  return request({
    base,
    options,
    url: '/peers/all',
  });
}

/**
 * GET /peers/connected
 * Connected peers list
 */
export function fetchConnected(
  base: string,
  options: RequestInit = {},
): Promise<IAllConnectedResponse> {
  return request({
    base,
    options,
    url: '/peers/connected',
  });
}

/**
 * GET /peers/blacklisted
 * Blacklisted peers list
 */
export function fetchBlackListed(base: string, options: RequestInit = {}): Promise<IBlackPeer[]> {
  return request({
    base,
    options,
    url: '/peers/blacklisted',
  });
}

/**
 * GET /peers/suspended
 * Suspended peers list
 */
export function fetchSuspended(base: string, options: RequestInit = {}): Promise<ISuspendedPeer[]> {
  return request({
    base,
    options,
    url: '/peers/suspended',
  });
}

// NOTE: Requires node API key
// POST /peers/clearblacklist
// POST /peers/connect

export interface IAllResponse {
  peers: IPeerAllResponse[];
}

export interface IAllConnectedResponse {
  peers: IPeerConnectedResponse[];
}

export interface IPeerAllResponse {
  address: string;
  lastSeen: TLong;
}

export interface IPeerConnectedResponse {
  address: string;
  declaredAddress: string;
  peerName: string;
  peerNonce: TLong;
  applicationName: string;
  applicationVersion: string;
}

export interface IBlackPeer extends ISuspendedPeer {
  reason: string;
}

export interface ISuspendedPeer {
  hostname: string;
  timestamp: number;
}
