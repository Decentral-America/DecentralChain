// Allowlist of nodes the Load Test / Treasury tooling is permitted to target.
// Kept as a fixed list (not free text) so operators can't accidentally — or
// deliberately — point traffic-generating tools at an arbitrary host.
//
// gen-0/gen-1/val-0 aren't listed: they run inside the LKE cluster and are
// only reachable via `kubectl port-forward`, not from wherever this dashboard
// is deployed (see infra/clusters/testnet/apps/nodes.yaml). Add them here once
// there's a network path the dashboard can actually reach them over.
export interface TargetNode {
  label: string;
  url: string;
}

const MAIN_NODE: TargetNode = {
  label: 'Main Node (testnet)',
  url: 'https://testnet-node.decentralchain.io',
};

export const TARGET_NODES: readonly TargetNode[] = [MAIN_NODE] as const;

export const DEFAULT_TARGET_NODE = MAIN_NODE.url;

export function isAllowedTargetNode(url: string): boolean {
  return TARGET_NODES.some((n) => n.url === url);
}
