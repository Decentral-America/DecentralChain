/**
 * Settings Module Routes
 * Defines routes for application settings and preferences
 */
import { type RouteObject } from 'react-router-dom';

/**
 * Settings routes structure:
 * - /desktop/settings : Settings page with tabbed interface
 *   - General: Language, theme, notification preferences
 *   - Security: Backup phrases, security options
 *   - Network: Node configuration, network selection
 *   - Info: Version, updates, legal information
 *
 * Uses a tabbed interface matching the Angular app structure.
 * Uses React Router v7 `lazy` for code splitting — settings module excluded from main bundle.
 */
export const settingsRoutes: RouteObject = {
  lazy: async () => {
    const { SettingsPage } = await import('@/features/settings/SettingsPage');
    return { Component: SettingsPage };
  },
  path: 'settings',
};
