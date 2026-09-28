import { type ReactNode } from 'react';

/**
 * Whether an optional slot was given anything to render.
 *
 * `ReactNode` includes `Promise` in React 19, so a bare `{slot ? … : null}`
 * trips `noMisusedPromises`, and `Boolean(slot) ? …` is stripped again by
 * `noExtraBooleanCast`. Naming the check satisfies both without a suppression;
 * the truthiness is the same as the bare conditional's.
 */
export const hasContent = (node: ReactNode): boolean => Boolean(node);
