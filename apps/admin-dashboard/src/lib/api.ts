export interface BlockHeader {
  id: string;
  height: number;
  timestamp: number;
  generator: string;
  reward: number;
  totalFee: number;
  transactionCount: number;
}

export interface BalanceDetails {
  address: string;
  regular: number;
  generating: number;
  available: number;
  effective: number;
}

export interface NodeStatus {
  blockchainHeight: number;
  stateHeight: number;
  updatedTimestamp: number;
  updatedDate: string;
}

export interface NodeVersion {
  version: string;
}

export interface HeightResponse {
  height: number;
}

export interface RewardsResponse {
  height: number;
  totalDccAmount: number;
  currentReward: number;
  minIncrement: number;
  term: number;
  nextCheck: number;
  votingIntervalStart: number;
  votingInterval: number;
  votingThreshold: number;
  votes: { increase: number; decrease: number };
}

export interface ConnectedPeer {
  address: string;
  declaredAddress: string;
  peerName: string;
  peerNonce: number;
  applicationName: string;
  applicationVersion: string;
}

const FETCH_TIMEOUT_MS = 10_000;

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

export function fetchNodeStatus(nodeUrl: string): Promise<NodeStatus> {
  return get<NodeStatus>(`${nodeUrl}/node/status`);
}

export function fetchNodeVersion(nodeUrl: string): Promise<NodeVersion> {
  return get<NodeVersion>(`${nodeUrl}/node/version`);
}

export function fetchHeight(nodeUrl: string): Promise<HeightResponse> {
  return get<HeightResponse>(`${nodeUrl}/blocks/height`);
}

export function fetchBalanceDetails(nodeUrl: string, address: string): Promise<BalanceDetails> {
  return get<BalanceDetails>(`${nodeUrl}/addresses/balance/details/${address}`);
}

export function fetchRewards(nodeUrl: string): Promise<RewardsResponse> {
  return get<RewardsResponse>(`${nodeUrl}/blockchain/rewards`);
}

export function fetchConnectedPeers(nodeUrl: string): Promise<{ peers: ConnectedPeer[] }> {
  return get<{ peers: ConnectedPeer[] }>(`${nodeUrl}/peers/connected`);
}

export function fetchAllPeers(
  nodeUrl: string,
): Promise<{ peers: { address: string; lastSeen?: number }[] }> {
  return get(`${nodeUrl}/peers/all`);
}

export function fetchSuspendedPeers(
  nodeUrl: string,
): Promise<{ hostname: string; timestamp: number }[]> {
  return get(`${nodeUrl}/peers/suspended`);
}

export function fetchBlacklistedPeers(
  nodeUrl: string,
): Promise<{ hostname: string; timestamp: number; reason?: string }[]> {
  return get(`${nodeUrl}/peers/blacklisted`);
}

export function fetchBlockHeadersSeq(
  nodeUrl: string,
  from: number,
  to: number,
): Promise<BlockHeader[]> {
  return get<BlockHeader[]>(`${nodeUrl}/blocks/headers/seq/${from}/${to}`);
}

// Node API max range per request is 100. Fetch pages in parallel; skip failed
// pages rather than failing the entire request.
export async function fetchBlockHeadersSeqPaginated(
  nodeUrl: string,
  from: number,
  to: number,
): Promise<BlockHeader[]> {
  const PAGE = 100;
  const pages: Array<[number, number]> = [];
  for (let start = from; start <= to; start += PAGE) {
    pages.push([start, Math.min(start + PAGE - 1, to)]);
  }
  const results = await Promise.allSettled(
    pages.map(([f, t]) => fetchBlockHeadersSeq(nodeUrl, f, t)),
  );
  // Partial failures are silently dropped — the caller receives whatever pages
  // succeeded. Callers that need failure visibility should check result length
  // against the requested range.
  return results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
}
