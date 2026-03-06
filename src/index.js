import './interop.js';
import * as crypto from '@waves/ts-lib-crypto';
import * as scalaJsCompiler from '@waves/ride-lang';
import * as replJs from '@waves/ride-repl';

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
          bytes,
          base64: crypto.base64Encode(bytes),
          size: bytes.byteLength,
          ast,
          complexity,
          verifierComplexity,
          callableComplexities,
          userFunctionComplexities,
          globalVariableComplexities,
        },
      };
    }
  } catch (e) {
    console.log(e);
    return typeof e === 'object' ? { error: e.message } : { error: e };
  }
}

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

const flattenCompilationResult = (compiled) => {
  let result = {};
  if (compiled.error) {
    if (compiled.result) {
      const bytes = new Uint8Array(compiled.result);
      const base64 = crypto.base64Encode(bytes);
      result = { ...compiled, base64 };
      if (result.result) delete result.result;
    }
  } else {
    result = compiled.result;
  }
  return result;
};

export const compile = wrappedCompile;
export { wrappedRepl as repl };
export const contractLimits = scalaJsCompiler.contractLimits;
export const version = (() => {
  const v = scalaJsCompiler.nodeVersion();
  return v && v.version;
})();
export const scriptInfo = scalaJsCompiler.scriptInfo;
export const getTypes = scalaJsCompiler.getTypes;
export const getVarsDoc = scalaJsCompiler.getVarsDoc;
export const getFunctionsDoc = scalaJsCompiler.getFunctionsDoc;
export const decompile = scalaJsCompiler.decompile;
export { flattenCompilationResult };
export const parseAndCompile = scalaJsCompiler.parseAndCompile;

// Legacy default export for CJS compat
const api = {
  compile: wrappedCompile,
  repl: wrappedRepl,
  get contractLimits() {
    return scalaJsCompiler.contractLimits();
  },
  get version() {
    const v = scalaJsCompiler.nodeVersion();
    return v && v.version;
  },
  scriptInfo: scalaJsCompiler.scriptInfo,
  getTypes: scalaJsCompiler.getTypes,
  getVarsDoc: scalaJsCompiler.getVarsDoc,
  getFunctionsDoc: scalaJsCompiler.getFunctionsDoc,
  decompile: scalaJsCompiler.decompile,
  flattenCompilationResult,
  parseAndCompile: scalaJsCompiler.parseAndCompile,
};

globalThis.RideJS = api;
export default api;
