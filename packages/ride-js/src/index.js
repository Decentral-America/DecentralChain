/**
 * @module @decentralchain/ride-js
 * @description JS compiler for Ride — the smart-contract language for DecentralChain.
 * Wraps the Scala.js-compiled Ride compiler to provide compile, decompile,
 * REPL, and script-info utilities for Ride v1–v6 contracts.
 */

import './interop.js';
import * as crypto from '@decentralchain/ts-lib-crypto';
import * as scalaJsCompiler from '@waves/ride-lang';
import * as replJs from '@waves/ride-repl';

/**
 * Compile Ride source code to binary.
 *
 * @param {string} code - Ride source code to compile.
 * @param {number} [estimatorVersion=3] - Complexity estimator version (1-3).
 * @param {boolean} [needCompaction=false] - Whether to compact the output.
 * @param {boolean} [removeUnusedCode=false] - Strip dead code from the result.
 * @param {Record<string, string>} [libraries={}] - Named library sources for imports.
 * @returns {{ result: { bytes: Uint8Array, base64: string, size: number, ast: object, complexity: number, verifierComplexity?: number, callableComplexities?: Record<string, number>, userFunctionComplexities?: Record<string, number>, globalVariableComplexities?: Record<string, number> } } | { error: string }} Compilation result or error.
 */
function wrappedCompile(
  code,
  estimatorVersion = 3,
  needCompaction = false,
  removeUnusedCode = false,
  libraries = {},
) {
  if (typeof code !== 'string') {
    return { error: 'Type error: contract should be string' };
  }
  try {
    const result = scalaJsCompiler.compile(
      code,
      estimatorVersion,
      needCompaction,
      removeUnusedCode,
      libraries,
    );
    if (result.error) {
      try {
        result.size = new Uint8Array(result.result).length;
      } catch {
        /* ignore */
      }
      return result;
    } else {
      const bytes = new Uint8Array(result.result);
      const {
        ast,
        complexity,
        verifierComplexity,
        callableComplexities,
        userFunctionComplexities,
        globalVariableComplexities,
      } = result;
      return {
        result: {
          ast,
          base64: crypto.base64Encode(bytes),
          bytes,
          callableComplexities,
          complexity,
          globalVariableComplexities,
          size: bytes.byteLength,
          userFunctionComplexities,
          verifierComplexity,
        },
      };
    }
  } catch (e) {
    console.error(e);
    return typeof e === 'object' ? { error: e.message } : { error: e };
  }
}

/**
 * Create an interactive REPL session for evaluating Ride expressions.
 *
 * @param {{ nodeUrl: string, chainId: string, address: string }} [opts] -
 *   Optional connection settings. When omitted a local offline REPL is created.
 * @returns {{ evaluate: (expr: string) => Promise<{ result: string } | { error: any }>, reconfigure: (opts: { nodeUrl: string, chainId: string, address: string }) => ReturnType<typeof wrappedRepl>, clear: () => void, test: (str: string) => Promise<string>, info: (s: string) => string, totalInfo: () => string }} REPL instance.
 */
function wrappedRepl(opts) {
  const repl =
    opts != null
      ? replJs.repl(
          new replJs.NodeConnectionSettings(opts.nodeUrl, opts.chainId.charCodeAt(0), opts.address),
        )
      : replJs.repl();

  const wrapReconfigure = (replInstance) => {
    const reconfigureFn = replInstance.reconfigure.bind(replInstance);
    return (newOpts) => {
      const settings = new replJs.NodeConnectionSettings(
        newOpts.nodeUrl,
        newOpts.chainId.charCodeAt(0),
        newOpts.address,
      );
      const newRepl = reconfigureFn(settings);
      newRepl.reconfigure = wrapReconfigure(newRepl);
      return newRepl;
    };
  };

  repl.reconfigure = wrapReconfigure(repl);
  return repl;
}

/**
 * Flatten a nested compilation result into a single-level object.
 *
 * When compilation succeeds the result is unwrapped from `compiled.result`;
 * when it fails the error is surfaced with an optional `base64` of the
 * partially compiled bytes.
 *
 * @param {import('./index.d.ts').ICompilationResult | import('./index.d.ts').ICompilationError} compiled — The raw compilation output.
 * @returns {import('./index.d.ts').IFlattenedCompilationResult} Flat result.
 */
const flattenCompilationResult = (compiled) => {
  let result = {};
  if ('error' in compiled) {
    if ('result' in compiled) {
      const bytes = new Uint8Array(/** @type {ArrayBuffer} */ (compiled.result));
      const base64 = crypto.base64Encode(bytes);
      result = { ...compiled, base64 };
      if ('result' in result) delete result.result;
    }
  } else {
    result = compiled.result;
  }
  return result;
};

/** Compile Ride source code to binary. */
export const compile = wrappedCompile;

/** Create an interactive REPL session for evaluating Ride expressions. */
export { wrappedRepl as repl };

/** Get contract compilation limits for a given stdlib version. */
export const contractLimits = scalaJsCompiler.contractLimits;

/** Current Ride compiler version string. */
export const version = (() => {
  const v = scalaJsCompiler.nodeVersion();
  return v?.version;
})();

/** Get metadata about a compiled Ride script (version, type, public keys, etc.). */
export const scriptInfo = scalaJsCompiler.scriptInfo;

/** Get available types for a given standard library version. */
export const getTypes = scalaJsCompiler.getTypes;

/** Get variable documentation for a given standard library version. */
export const getVarsDoc = scalaJsCompiler.getVarsDoc;

/** Get function documentation for a given standard library version. */
export const getFunctionsDoc = scalaJsCompiler.getFunctionsDoc;

/** Decompile a base64-encoded compiled script back to Ride source code. */
export const decompile = scalaJsCompiler.decompile;

export { flattenCompilationResult };

/** Parse and compile Ride source with additional AST information. */
export const parseAndCompile = scalaJsCompiler.parseAndCompile;

// Legacy default export for CJS compat
const api = {
  compile: wrappedCompile,
  get contractLimits() {
    return scalaJsCompiler.contractLimits();
  },
  decompile: scalaJsCompiler.decompile,
  flattenCompilationResult,
  getFunctionsDoc: scalaJsCompiler.getFunctionsDoc,
  getTypes: scalaJsCompiler.getTypes,
  getVarsDoc: scalaJsCompiler.getVarsDoc,
  parseAndCompile: scalaJsCompiler.parseAndCompile,
  repl: wrappedRepl,
  scriptInfo: scalaJsCompiler.scriptInfo,
  get version() {
    const v = scalaJsCompiler.nodeVersion();
    return v?.version;
  },
};

globalThis.RideJS = api;
export default api;
