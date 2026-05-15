// Re-export the root base config for packages under packages/ts/*
// All SDK packages import '../../vitest.base.config' which resolves here
// (packages/ts/<pkg> → ../../ = packages/)
export { default } from '../vitest.base.config';
