import type { RouteObject } from 'react-router-dom';

import { BottomPanel } from '../layout/bottomPanel';
import { Menu } from '../ui/components/menu/Menu';
import { AddressBook } from '../ui/components/pages/AddressBook';
import { AccountInfo } from '../ui/components/pages/accountInfo';
import { ActiveMessagePage } from '../ui/components/pages/activeMessage';
import { ActiveNotificationPage } from '../ui/components/pages/activeNotification';
import { ChangePassword } from '../ui/components/pages/ChangePassword';
import { ChangeAccountName } from '../ui/components/pages/changeAccountName';
import { DeleteAccount } from '../ui/components/pages/deleteAccount';
import { DeleteAllAccounts } from '../ui/components/pages/deleteAllAccounts/deleteAllAccounts';
import { ExportAndImport } from '../ui/components/pages/ExportAndImport';
import { ErrorPage } from '../ui/components/pages/errorPage';
import { ExportAccounts } from '../ui/components/pages/exportAccounts/exportAccounts';
import { ExportAddressBook } from '../ui/components/pages/exportAccounts/exportAddressBook';
import { Info } from '../ui/components/pages/Info';
import { LangsSettings } from '../ui/components/pages/LangsSettings';
import { MessagesAndNotificationsPage } from '../ui/components/pages/messagesAndNotifications';
import { NetworkSettings } from '../ui/components/pages/networkSettings';
import { NftCollection } from '../ui/components/pages/nfts/nftCollection';
import { NftInfo } from '../ui/components/pages/nfts/nftInfo';
import { OtherAccountsPage } from '../ui/components/pages/otherAccounts';
import { PermissionsSettings } from '../ui/components/pages/PermissionsSettings/PermissionSettings';
import { PopupHome } from '../ui/components/pages/popupHome';
import { SelectedAccountQr } from '../ui/components/pages/SelectedAccountQr';
import { Settings } from '../ui/components/pages/Settings';
import { SettingsGeneral } from '../ui/components/pages/SettingsGeneral';
import { Send } from '../ui/components/pages/send';
import { Swap } from '../ui/components/pages/swap/swap';
import { Root } from '../ui/components/Root';

export const routes: RouteObject[] = [
  {
    children: [
      {
        element: (
          <>
            <Menu hasLogo hasSettings />
            <PopupHome />
            <BottomPanel allowChangingNetwork />
          </>
        ),
        path: '/',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <SelectedAccountQr />
          </>
        ),
        path: '/qr-code',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <AccountInfo />
          </>
        ),
        path: '/account-info/:address',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <ChangeAccountName />
            <BottomPanel />
          </>
        ),
        path: '/change-account-name/:address',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <DeleteAccount />
          </>
        ),
        path: '/delete-account/:address',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <OtherAccountsPage />
          </>
        ),
        path: '/other-accounts',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <Send />
          </>
        ),
        path: '/send/:assetId',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <Swap />
          </>
        ),
        path: '/swap',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <NftCollection />
          </>
        ),
        path: '/nft-collection/:creator',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <NftInfo />
          </>
        ),
        path: '/nft/:assetId',
      },
      {
        element: (
          <>
            <Menu hasBack />
            <Info />
          </>
        ),
        path: '/about',
      },
      {
        element: (
          <>
            <Menu hasClose hasLogo />
            <Settings />
          </>
        ),
        path: '/settings',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <AddressBook />
          </>
        ),
        path: '/address-book',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <SettingsGeneral />
          </>
        ),
        path: '/settings/general',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <ChangePassword />
          </>
        ),
        path: '/change-password',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <PermissionsSettings />
          </>
        ),
        path: '/settings/permissions',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <LangsSettings />
          </>
        ),
        path: '/settings/language',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <NetworkSettings />
          </>
        ),
        path: '/settings/network',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <ExportAndImport />
          </>
        ),
        path: '/settings/export-and-import',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <ExportAccounts />
          </>
        ),
        path: '/export-accounts',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <ExportAddressBook />
          </>
        ),
        path: '/export-address-book',
      },
      {
        element: (
          <>
            <Menu hasBack hasLogo />
            <DeleteAllAccounts />
          </>
        ),
        path: '/delete-all-accounts',
      },
      {
        element: (
          <>
            <Menu hasLogo />
            <ActiveNotificationPage />
          </>
        ),
        path: '/active-notification',
      },
      {
        element: (
          <>
            <Menu hasLogo />
            <ActiveMessagePage />
          </>
        ),
        path: '/active-message',
      },
      {
        element: <MessagesAndNotificationsPage />,
        path: '/messages-and-notifications',
      },
      {
        element: <DeleteAllAccounts />,
        path: '/forgot-password',
      },
    ],
    element: <Root />,
    errorElement: <ErrorPage />,
  },
];
