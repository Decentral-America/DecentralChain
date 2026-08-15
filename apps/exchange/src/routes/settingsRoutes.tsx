/**
 * Settings Module Routes
 * Defines routes for application settings and preferences
 */
import { type RouteObject } from 'react-router';
import { ResponsiveScreen } from '@/layouts/ResponsiveLayout';
import { lazyPage } from './lazyPage';

/**
 * Settings routes structure:
 * - /desktop/settings : Settings page with tabbed interface
 *   - General: Language, theme, notification preferences
 *   - Security: Backup phrases, security options
 *   - Network: Node configuration, network selection
 *   - Info: Version, updates, legal information
 *
 * Uses a tabbed interface matching the Angular app structure. On mobile,
 * `MobileAccount` stands in for the settings screen — the account/profile
 * screen is where a phone's settings live in this shell.
 */
const SettingsPage = lazyPage(() => import('@/features/settings/SettingsPage'), 'SettingsPage');
const MobileAccount = lazyPage(() => import('@/pages/mobile/MobileAccount'), 'MobileAccount');

export const settingsRoutes: RouteObject = {
  element: <ResponsiveScreen mobile={<MobileAccount />} desktop={<SettingsPage />} />,
  path: 'settings',
};
