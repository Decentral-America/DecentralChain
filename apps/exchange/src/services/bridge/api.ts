/**
 * Bridge REST API.
 *
 * Four endpoints, no authentication. Reuses the app's `FetchClient` for its
 * HTTPS enforcement, timeout and error logging rather than calling `fetch`
 * directly.
 *
 * CORS: the API allows a fixed origin list. A request from an origin that is
 * not on it fails with no useful message in the console, which reads like a
 * network fault rather than a configuration one — see `assertOriginAllowed`.
 */
import { apiGet, FetchClient, HttpError } from '@/api/client';
import { API_CLIENT_BASE, BLOCKED_TOKEN_NAMES } from '@/config/bridge';
import { logger } from '@/lib/logger';
import {
  type BridgeStats,
  type BridgeToken,
  type DepositLimits,
  type TokensResponse,
  type Transfer,
  type TransferResponse,
} from './types';

const bridgeClient = new FetchClient(API_CLIENT_BASE);

/**
 * Origins the API's `ALLOWED_ORIGINS` permits. Kept here only to turn an
 * opaque CORS failure into a sentence that names the cause. Adding an origin
 * here changes nothing on the server.
 */
const KNOWN_ALLOWED_ORIGINS = [
  'https://bridge.decentralswap.com',
  'https://app.decentralswap.com',
  'https://frontend-production-d1ba1.up.railway.app',
];

/** Warns once, at startup, when this origin will be refused by the API. */
export const assertOriginAllowed = (): void => {
  if (typeof window === 'undefined') return;

  const origin = window.location.origin;
  if (KNOWN_ALLOWED_ORIGINS.includes(origin)) return;

  logger.warn(
    `[bridge] Origin ${origin} is not in the bridge API's known ALLOWED_ORIGINS. ` +
      'Every bridge request will fail CORS, which surfaces as a generic network ' +
      'error with nothing useful in the console. Add this origin to ALLOWED_ORIGINS ' +
      'on the API service.',
  );
};

/**
 * A sentence the user can act on, from whatever the network layer threw.
 *
 * `fetch` rejects with a bare `TypeError: Failed to fetch` for every
 * connection-level failure alike — API down, DNS, CORS, offline — and that
 * string shown in the UI reads as a bug in this app rather than an unreachable
 * API. Worse, it is what the caller gets in development for the most ordinary
 * cause of all: `API_CLIENT_BASE` is a same-origin path there, forwarded by the
 * Vite dev server, so a dev server that is restarting refuses the connection
 * and every bridge query fails at once.
 */
export const describeBridgeError = (error: unknown): string => {
  if (error instanceof HttpError) {
    if (error.status === 429) {
      return 'The bridge API is rate-limiting this browser. It will retry on its own shortly.';
    }
    if (error.status >= 500) {
      return `The bridge API returned ${error.status}. That is on the API's side, not yours.`;
    }
    return `The bridge API refused the request (${error.status} ${error.statusText}).`;
  }

  if (error instanceof DOMException && error.name === 'TimeoutError') {
    return 'The bridge API did not answer in time.';
  }

  return import.meta.env.DEV
    ? 'Could not reach the bridge API. In development these requests go through the Vite dev-server proxy, so this usually means the dev server is not running.'
    : 'Could not reach the bridge API. Check your connection — the bridge itself is unaffected, and any transfer already submitted settles regardless.';
};

/**
 * Every registered asset the bridge will accept, minus the ones it will accept
 * and then strand.
 *
 * Four assets are disabled on chain and the API omits them within 30 seconds
 * of the change — that part needs no help. Three more report as `enabled` but
 * cannot succeed at any realistic amount, because the deposit minimum and
 * maximum are raw values applied uniformly across assets of different
 * decimals. Those are filtered here.
 */
export const getTokens = async (): Promise<BridgeToken[]> => {
  const response = await apiGet<TokensResponse>(bridgeClient, '/tokens');

  return response.tokens.filter(
    (token) => token.enabled && !BLOCKED_TOKEN_NAMES.includes(token.name),
  );
};

/** Unfiltered, for diagnostics — shows what the bridge reports before we judge it. */
export const getAllTokens = async (): Promise<TokensResponse> =>
  apiGet<TokensResponse>(bridgeClient, '/tokens');

export const getDepositLimits = async (splMint: string): Promise<DepositLimits> =>
  apiGet<DepositLimits>(bridgeClient, '/deposit/limits', { splMint });

export const getStats = async (): Promise<BridgeStats> =>
  apiGet<BridgeStats>(bridgeClient, '/stats');

export const getTransfer = async (transferId: string): Promise<Transfer> => {
  const response = await apiGet<TransferResponse>(bridgeClient, `/transfer/${transferId}`);
  return response.transfer;
};

/** A transfer in one of these states will not change again. */
const TERMINAL_STATUSES: readonly string[] = ['completed', 'failed'];

export const isSettledStatus = (status: string): boolean => TERMINAL_STATUSES.includes(status);

/**
 * True when the API returned a placeholder rather than a real transfer.
 *
 * `GET /transfer/:id` answers 200 `{success: true}` for an id it has never
 * seen, synthesising a record with status `pending_confirmation`, an empty
 * sender and a zero amount. Nothing in the response says "unknown".
 *
 * The catch — and this cost a false "stranded" warning on a deposit that had
 * actually completed — is that the API returns those same empty fields for
 * *real* transfers too. A settled deposit reads `status: "completed"` with
 * `sender: ""`, `amount: "0"` and `sourceTxHash: null`, identical to the
 * placeholder in every field but the status. So the status is the only
 * discriminator, and empty metadata on its own means nothing.
 *
 * Verified against the live API: an unknown id and a known-completed deposit
 * differ only in `status`.
 */
export const isUnknownTransfer = (transfer: Transfer): boolean => {
  if (isSettledStatus(transfer.status)) {
    return false;
  }

  return transfer.sender === '' && transfer.amount === '0' && transfer.sourceTxHash === null;
};

/**
 * The limit that will actually stop this deposit, with the reason.
 *
 * `sources` lists every bound the bridge applies and flags which one binds.
 * Reporting the binding one matters because the daily cap is a single counter
 * shared across all tokens: a user can be refused for a perfectly reasonable
 * amount because someone else spent the budget, and "amount too large" would
 * be a lie.
 */
export const bindingLimits = (limits: DepositLimits) =>
  limits.sources.filter((source) => source.binding);
