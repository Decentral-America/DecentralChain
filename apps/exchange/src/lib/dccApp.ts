/**
 * DCCApp singleton — module-level application configuration.
 *
 * Replaces the Angular-era `window.DCCApp` global object. All code that
 * previously read from `window.DCCApp.*` should import from this module
 * instead, gaining proper TypeScript types and eliminating window pollution.
 */

import { stringifyJSON } from '@/utils/formatters';

/** Application-level utilities shared across the data-service layer. */
export const dccApp = {
  stringifyJSON,
} as const;
