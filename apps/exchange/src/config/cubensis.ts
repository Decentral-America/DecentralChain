/**
 * Cubensis Connect (browser extension) availability.
 *
 * The extension has no store listing yet. Until one exists, the import tile
 * and route are hidden and no install button is rendered — the button must
 * only ever point at DecentralChain's own listing. Both values are build-time
 * environment, public by nature (`VITE_` values ship in the bundle).
 */
export const CUBENSIS_INSTALL_URL: string = import.meta.env.VITE_CUBENSIS_INSTALL_URL ?? '';

export const CUBENSIS_ENABLED: boolean =
  import.meta.env.VITE_CUBENSIS_ENABLED === 'true' && CUBENSIS_INSTALL_URL.startsWith('https://');
