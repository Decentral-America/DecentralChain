/**
 * Settings Module Routes
 * Defines routes for application settings and preferences
 */
import { type RouteObject } from 'react-router-dom';
import { SettingsPage } from '@/features/settings/SettingsPage';

/**
 * Settings routes structure:
 * - /desktop/settings : Settings page with tabbed interface
 *   - General: Language, theme, notification preferences
 *   - Security: Backup phrases, security options
 *   - Network: Node configuration, network selection
 *   - Info: Version, updates, legal information
 *
 * Uses a tabbed interface matching the Angular app structure
 */
export const settingsRoutes: RouteObject = {
  element: <SettingsPage />,
  path: 'settings',
};
