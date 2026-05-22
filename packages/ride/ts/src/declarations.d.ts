// Ambient module declarations for Scala.js-compiled packages.
// These packages are built by the sbt build (packages/ride/lang and packages/ride/repl)
// and produce dist/*.js + dist/*.d.ts at build time. The type stubs here allow
// TypeScript to resolve them during linting and typecheck before a Scala.js build.
declare module '@decentralchain/ride-lang';
declare module '@decentralchain/ride-repl';
