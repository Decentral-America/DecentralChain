/**
 * @module @decentralchain/ride-js
 * @description JS compiler for Ride — the smart-contract language for DecentralChain.
 * Wraps the Scala.js-compiled Ride compiler to provide compile, decompile,
 * REPL, and script-info utilities for Ride v1–v6 contracts.
 */

import './interop.js';
import * as scalaJsCompiler from '@decentralchain/ride-lang';
import * as replJs from '@decentralchain/ride-repl';
import * as crypto from '@decentralchain/ts-lib-crypto';

// ---------------------------------------------------------------------------
// Public types (previously in index.d.ts — collocated with implementation)
// ---------------------------------------------------------------------------

export interface ICompilationResult {
  result: {
    ast: object;
    base64: string;
    bytes: Uint8Array;
    size: number;
    complexity: number;
    verifierComplexity?: number;
    callableComplexities?: Record<string, number>;
    userFunctionComplexities?: Record<string, number>;
    globalVariableComplexities?: Record<string, number>;
  };
}

export interface ICompilationError {
  error: string;
}

export interface IDecompilationResult {
  result: string;
}

export interface IDecompilationError {
  error: string;
}

export type TType = TList | TStruct | TUnion | TPrimitive;
export type TPrimitive = string;
export type TStructField = { name: string; type: TType };
export type TStruct = { typeName: string; fields: TStructField[] };
export type TList = { listOf: TType };
export type TUnionItem = TStruct | TPrimitive | TList;
export type TUnion = TUnionItem[];

export type TFunction = {
  name: string;
  doc: string;
  resultType: TType;
  args: TFunctionArgument[];
};

export type TFunctionArgument = {
  name: string;
  type: TType;
  doc: string;
};

export interface IVarDoc {
  name: string;
  type: TType;
  doc: string;
}

export interface IScriptInfo {
  stdLibVersion: number;
  contentType: number;
  scriptType: number;
  imports: string[];
}

export interface IFlattenedCompilationResult {
  ast?: object;
  base64?: string;
  bytes?: Uint8Array;
  callableComplexities?: Record<string, number>;
  complexity?: number;
  error?: string;
  globalVariableComplexities?: Record<string, number>;
  size?: number;
  userFunctionComplexities?: Record<string, number>;
  verifierComplexity?: number;
}

export interface IReplOptions {
  nodeUrl: string;
  chainId: string;
  address: string;
}

export interface IPos {
  posStart: number;
  posEnd: number;
}

export interface IName extends IPos {
  value: string;
}

export interface IContext extends IPos {
  name: string;
}

export interface INode extends IPos {
  type: TNodeType;
  resultType: string;
  ctx: IContext[];
}

export type TExprResultType =
  | { type: string }
  | { unionTypes: TExprResultType[] }
  | { listOf: TExprResultType };

export interface IExprNode extends Omit<INode, 'resultType'> {
  resultType: TExprResultType;
}

export interface IError extends IPos {
  msg: string;
}

export interface IConstByteStr extends IExprNode {
  type: 'CONST_BYTESTR';
}
export interface IConstLong extends IExprNode {
  type: 'CONST_LONG';
}
export interface IConstStr extends IExprNode {
  type: 'CONST_STRING';
}
export interface ITrue extends IExprNode {
  type: 'TRUE';
}
export interface IFalse extends IExprNode {
  type: 'FALSE';
}
export interface IRef extends IExprNode {
  type: 'REF';
  name: string;
}
export interface IBlock extends IExprNode {
  type: 'BLOCK';
  dec: TDecl;
  body: TExpr;
}
export interface IIf extends IExprNode {
  type: 'IF';
  cond: TExpr;
  ifTrue: TExpr;
  ifFalse: TExpr;
}
export interface IGetter extends IExprNode {
  type: 'GETTER';
  ref: TExpr;
  field: IName;
  name: string;
}
export interface IMatch extends IExprNode {
  type: 'MATCH';
  expr: TExpr;
  cases: IMatchCase[];
}
export interface IMatchCase extends INode {
  type: 'MATCH_CASE';
  expr: TExpr;
}
export interface ILet extends INode {
  type: 'LET';
  name: IName;
  expr: TExpr;
  dec?: TDecl;
}
export interface IScript extends Omit<INode, 'resultType'> {
  type: 'SCRIPT';
  expr: TExpr;
}
export interface IDApp extends Omit<INode, 'resultType'> {
  type: 'DAPP';
  decList: (ILet | IFunc)[];
  annFuncList: IAnnotatedFunc[];
}
export interface IAnnotatedFunc extends Omit<INode, 'resultType'> {
  type: 'ANNOTATEDFUNC';
  annList: IAnnotation[];
  func: IFunc;
}
export interface IAnnotation extends Omit<INode, 'resultType'> {
  type: 'ANNOTATION';
  name: IName;
  argList: IName[];
}
export interface IFunc extends INode {
  type: 'FUNC';
  name: IName;
  expr: TExpr;
  argList: TArgument[];
  body: IBlock | IFunctionCall;
}
export interface IFunctionCall extends IExprNode {
  type: 'FUNCTION_CALL';
  name: IName;
  args: TExpr[];
}

export type TArgument = { argName: IName; type: TArgumentType };
export type TArgumentType = { typeName: IName; typeParam?: ITypeParam };
export interface ITypeParam extends IPos {
  value: { isUnion: boolean; typeList: TArgumentType[] };
}

export type TPrimitiveNode = IConstStr | IConstLong | IConstByteStr | ITrue | IFalse;
export type TNode =
  | IBlock
  | IConstByteStr
  | IIf
  | IFunctionCall
  | IConstLong
  | IRef
  | IConstStr
  | ITrue
  | IFalse
  | IGetter
  | IMatch
  | ILet
  | IMatchCase
  | IFunc
  | IScript
  | IDApp
  | IAnnotatedFunc
  | IAnnotation;
export type TNodeType =
  | 'ANNOTATEDFUNC'
  | 'ANNOTATION'
  | 'BLOCK'
  | 'CONST_BYTESTR'
  | 'CONST_LONG'
  | 'CONST_STRING'
  | 'DAPP'
  | 'FALSE'
  | 'FUNC'
  | 'FUNCTION_CALL'
  | 'GETTER'
  | 'IF'
  | 'LET'
  | 'MATCH'
  | 'MATCH_CASE'
  | 'REF'
  | 'SCRIPT'
  | 'TRUE';
export type TDecl = ILet | IFunc;
export type TExpr =
  | IBlock
  | IConstByteStr
  | IIf
  | IFunctionCall
  | IConstLong
  | IConstStr
  | ITrue
  | IFalse
  | IGetter
  | IMatch
  | IRef;

export interface IParseAndCompileResult {
  result: ArrayBuffer;
  complexity: number;
  errorList: IError[];
  exprAst?: IScript;
  dAppAst?: IDApp;
}

// ---------------------------------------------------------------------------
// Compiler facade
// ---------------------------------------------------------------------------

function wrappedCompile(
  code: string,
  estimatorVersion = 3,
  needCompaction = false,
  removeUnusedCode = false,
  libraries: Record<string, string> = {},
): ICompilationResult | ICompilationError {
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
        result.size = new Uint8Array(result.result as ArrayBuffer).length;
      } catch {
        /* ignore */
      }
      return result as ICompilationError;
    }
    const bytes = new Uint8Array(result.result as ArrayBuffer);
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
        ast: ast as object,
        base64: crypto.base64Encode(bytes),
        bytes,
        ...(callableComplexities !== undefined && {
          callableComplexities: callableComplexities as Record<string, number>,
        }),
        complexity: complexity as number,
        ...(globalVariableComplexities !== undefined && {
          globalVariableComplexities: globalVariableComplexities as Record<string, number>,
        }),
        size: bytes.byteLength,
        ...(userFunctionComplexities !== undefined && {
          userFunctionComplexities: userFunctionComplexities as Record<string, number>,
        }),
        ...(verifierComplexity !== undefined && {
          verifierComplexity: verifierComplexity as number,
        }),
      },
    };
  } catch (e: unknown) {
    console.error(e);
    return e instanceof Error ? { error: e.message } : { error: String(e) };
  }
}

// ---------------------------------------------------------------------------
// REPL facade
// ---------------------------------------------------------------------------

type ReplInstance = {
  reconfigure: (opts: IReplOptions) => ReplInstance;
  evaluate: (expr: string) => Promise<IDecompilationResult | IDecompilationError>;
  clear: () => void;
  test: (str: string) => Promise<string>;
  info: (s: string) => string;
  totalInfo: () => string;
};

function wrappedRepl(opts?: IReplOptions): ReplInstance {
  const repl =
    opts != null
      ? replJs.repl(
          new replJs.NodeConnectionSettings(opts.nodeUrl, opts.chainId.charCodeAt(0), opts.address),
        )
      : replJs.repl();

  const wrapReconfigure = (
    replInstance: typeof repl,
  ): ((newOpts: IReplOptions) => ReplInstance) => {
    const reconfigureFn = replInstance.reconfigure.bind(replInstance);
    return (newOpts: IReplOptions): ReplInstance => {
      const settings = new replJs.NodeConnectionSettings(
        newOpts.nodeUrl,
        newOpts.chainId.charCodeAt(0),
        newOpts.address,
      );
      const newRepl = reconfigureFn(settings);
      newRepl.reconfigure = wrapReconfigure(newRepl);
      return newRepl as unknown as ReplInstance;
    };
  };

  repl.reconfigure = wrapReconfigure(repl);
  return repl as unknown as ReplInstance;
}

// ---------------------------------------------------------------------------
// Flatten compilation result
// ---------------------------------------------------------------------------

export const flattenCompilationResult = (
  compiled: ICompilationResult | ICompilationError,
): IFlattenedCompilationResult => {
  let result: IFlattenedCompilationResult = {};
  if ('error' in compiled) {
    if ('result' in compiled) {
      const bytes = new Uint8Array((compiled as { result: ArrayBuffer }).result);
      const base64 = crypto.base64Encode(bytes);
      const { result: _drop, ...rest } = compiled as ICompilationError & { result: ArrayBuffer };
      result = { ...rest, base64 };
    } else {
      result = compiled;
    }
  } else {
    result = compiled.result;
  }
  return result;
};

// ---------------------------------------------------------------------------
// Named exports — each consumer imports exactly what it needs
// ---------------------------------------------------------------------------

/** Compile Ride source code to binary. */
export const compile = wrappedCompile;

/** Create an interactive REPL session for evaluating Ride expressions. */
export { wrappedRepl as repl };

/** Get contract compilation limits for a given stdlib version. */
export const contractLimits = scalaJsCompiler.contractLimits;

/** Current Ride compiler version string. */
export const version: string | undefined = (() => {
  const v = scalaJsCompiler.nodeVersion();
  return v?.version as string | undefined;
})();

/** Get metadata about a compiled Ride script (version, type, public keys, etc.). */
export const scriptInfo = scalaJsCompiler.scriptInfo as (
  code: string,
) => IScriptInfo | ICompilationError;

/** Get available types for a given standard library version. */
export const getTypes = scalaJsCompiler.getTypes as (
  stdlibVersion?: number,
  isTokenContext?: boolean,
  isContract?: boolean,
) => TStructField[];

/** Get variable documentation for a given standard library version. */
export const getVarsDoc = scalaJsCompiler.getVarsDoc as (
  stdlibVersion?: number,
  isTokenContext?: boolean,
  isContract?: boolean,
) => IVarDoc[];

/** Get function documentation for a given standard library version. */
export const getFunctionsDoc = scalaJsCompiler.getFunctionsDoc as (
  stdlibVersion?: number,
  isTokenContext?: boolean,
  isContract?: boolean,
) => TFunction[];

/** Decompile a base64-encoded compiled script back to Ride source code. */
export const decompile = scalaJsCompiler.decompile as (
  compiledCode: string,
) => IDecompilationResult | IDecompilationError;

/** Parse and compile Ride source with additional AST information. */
export const parseAndCompile = scalaJsCompiler.parseAndCompile as (
  code: string,
  estimatorVersion?: number,
  needCompaction?: boolean,
  removeUnusedCode?: boolean,
  libs?: Record<string, string>,
) => IParseAndCompileResult | ICompilationError;

// ---------------------------------------------------------------------------
// Legacy default export (CJS / UMD compat — consumed by older tooling)
// ---------------------------------------------------------------------------

const api = {
  compile: wrappedCompile,
  get contractLimits() {
    return scalaJsCompiler.contractLimits();
  },
  decompile: decompile,
  flattenCompilationResult,
  getFunctionsDoc: getFunctionsDoc,
  getTypes: getTypes,
  getVarsDoc: getVarsDoc,
  parseAndCompile: parseAndCompile,
  repl: wrappedRepl,
  scriptInfo: scriptInfo,
  get version(): string | undefined {
    const v = scalaJsCompiler.nodeVersion();
    return v?.version as string | undefined;
  },
};

export default api;
