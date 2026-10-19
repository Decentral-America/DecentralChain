/**
 * GET /api/health — liveness for monitors, plus the faucet's public address
 * so the infra exporter can alert on the faucet balance. Not rate-limited at
 * the edge (unlike /api/faucet) and never touches the node.
 */
import { faucetAddress } from '@/lib/faucet-config';

export function loader(): Response {
  const address = faucetAddress();
  return Response.json(
    { faucet: { address, configured: address !== null }, status: 'ok' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
