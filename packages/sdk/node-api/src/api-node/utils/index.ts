import { type Transaction, type WithApiMixin } from '@decentralchain/types';
import { type TLong } from '../../interface';
import request from '../../tools/request';
import stringify from '../../tools/stringify';

/**
 * GET /utils/seed
 * Generate random seed
 */
export function fetchSeed(base: string, length?: number): Promise<{ seed: string }> {
  return request({
    base,
    url: `/utils/seed${length ? `/${length}` : ''}`,
  });
}

/**
 * POST /utils/script/compileCode
 * Compiles string code to base64 script representation
 */
export function fetchCompileCode(base: string, body: string): Promise<ICompileCode> {
  return request({
    base,
    options: {
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    url: '/utils/script/compileCode',
  });
}

/**
 * POST /utils/script/compileWithImports
 * Compiles string code with imports to base64 script representation
 */
export function fetchCompileWithImports(
  base: string,
  body: ICompileWithImportsBody,
): Promise<ICompileCode> {
  return request({
    base,
    options: {
      body: stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    url: '/utils/script/compileWithImports',
  });
}

/**
 * POST /utils/script/estimate
 * Estimates compiled code in Base64 representation
 */
export function fetchEstimate(base: string, body: string): Promise<IEstimate> {
  return request({
    base,
    options: {
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    url: '/utils/script/estimate',
  });
}

/**
 * POST /utils/script/evaluate
 * Evaluates the provided expression, taking into account the deployed dApp contract
 */
export function fetchEvaluate(base: string, address: string, expr: string): Promise<IEvaluate> {
  return request({
    base,
    options: {
      body: JSON.stringify({ expr }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    url: `/utils/script/evaluate/${address}`,
  });
}

/**
 * POST /utils/transactionSerialize
 * Serialize transaction
 */
export function fetchTransactionSerialize(
  base: string,
  body: Transaction<TLong> & WithApiMixin,
): Promise<ITransactionSerialize> {
  return request({
    base,
    options: {
      body: stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    url: '/utils/transactionSerialize',
  });
}

/**
 * POST /utils/hash/secure
 * Return SecureCryptographicHash of specified message
 */
export function fetchHashSecure(base: string, body: string): Promise<IHashSecure> {
  return request({
    base,
    options: {
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    url: '/utils/hash/secure',
  });
}

/**
 * POST /utils/hash/fast
 * Return FastCryptographicHash of specified message
 */
export function fetchHashFast(base: string, body: string): Promise<IHashSecure> {
  return request({
    base,
    options: {
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    url: '/utils/hash/fast',
  });
}

/**
 * Account's script meta
 *
 * @deprecated `POST /utils/script/meta` was removed by node-scala's
 * `NODE-2203: Remove /utils/script/meta (#3311)` (commit `9b85f1dacd`), with no route left that
 * accepts an arbitrary base64 script body. The same underlying extraction
 * (`Global.dAppFuncTypes`) is still used server-side, but only via
 * `GET /addresses/scriptInfo/{address}/meta` (see `fetchScriptInfoMeta` in `api-node/addresses`),
 * which requires the script to already be deployed on-chain at an address — it cannot evaluate
 * an ad-hoc/undeployed compiled script the way this endpoint did. There is no drop-in
 * replacement with this function's signature, so it now throws instead of making a request that
 * would 404. Use `fetchScriptInfoMeta(base, address)` if the script is deployed.
 */
export function fetchScriptMeta(_base: string, _body: string): Promise<IScriptMeta> {
  return Promise.reject(
    new Error(
      `fetchScriptMeta: removed server-side in node-scala commit 9b85f1dacd ` +
        `("NODE-2203: Remove /utils/script/meta (#3311)"), no drop-in replacement — ` +
        `POST /utils/script/meta no longer exists on any real node. Use ` +
        `fetchScriptInfoMeta(base, address) from api-node/addresses instead if the script is ` +
        `already deployed on-chain.`,
    ),
  );
}

/**
 * POST /utils/script/decompile
 * Decompiles base64 script representation to string code
 */
export function fetchScriptDecompile(base: string, body: string): Promise<IScriptDecompile> {
  return request({
    base,
    options: {
      body,
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    },
    url: '/utils/script/decompile',
  });
}

/**
 * GET /utils/time
 * Current Node time (UTC)
 */
export function fetchNodeTime(base: string): Promise<INodeTime> {
  return request({
    base,
    url: '/utils/time',
  });
}

interface IScriptMeta {
  version?: string;
  callableFuncTypes?: Record<string, Record<string, 'Int' | 'String' | 'Binary'>>[];
}

interface IScriptDecompile {
  STDLIB_VERSION: number;
  CONTENT_TYPE: string;
  script: string;
  SCRIPT_TYPE?: string;
}

export interface ICompileCode {
  script: string;
  complexity: number;
  callableComplexities: Record<string, number>;
  verifierComplexity: number;
  extraFee: TLong;
}

export interface IEstimate extends ICompileCode {
  scriptText: string;
}

export interface IEvaluate {
  address: string;
  expr: string;
  result: object;
  complexity: number;
}

interface ICompileWithImportsBody {
  script: string;
  imports: object;
}

interface IHashSecure {
  message: string;
  hash: string;
}

interface ITransactionSerialize {
  bytes: number[];
}

interface INodeTime {
  system: number;
  NTP: number;
}
