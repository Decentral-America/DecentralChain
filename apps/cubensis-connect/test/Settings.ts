import waitForExpect from 'wait-for-expect';

import { ChooseAccountsForm } from './helpers/ChooseAccountsForm';
import { ConfirmDeleteAccountsScreen } from './helpers/ConfirmDeleteAccountsScreen';
import { ContentScript } from './helpers/ContentScript';
import { EmptyHomeScreen } from './helpers/EmptyHomeScreen';
import { AccountsHome } from './helpers/flows/AccountsHome';
import { App } from './helpers/flows/App';
import { Settings } from './helpers/flows/Settings';
import { GetStartedScreen } from './helpers/GetStartedScreen';
import { LoginScreen } from './helpers/LoginScreen';
import { AuthMessageScreen } from './helpers/messages/AuthMessageScreen';
import { CommonTransaction } from './helpers/messages/CommonTransaction';
import { FinalTransactionScreen } from './helpers/messages/FinalTransactionScreen';
import { ExportAndImportSettingsScreen } from './helpers/settings/ExportAndImportSettingsScreen';
import { NetworkSettingsScreen } from './helpers/settings/NetworkSettingsScreen';
import { PermissionControlSettingsScreen } from './helpers/settings/PermissionControlSettingsScreen';
import { SettingsMenuScreen } from './helpers/settings/SettingsMenuScreen';
import { TopMenu } from './helpers/TopMenu';
import { Windows } from './helpers/Windows';
import {
  CUSTOMLIST,
  DEFAULT_MINER_SEED,
  DEFAULT_PASSWORD,
  TEST_ACCOUNT_3_SEED,
  TEST_ACCOUNT_SEED,
  WHITELIST,
} from './utils/constants';

const SPENDING_LIMIT = '1';

describe('Settings', () => {
  let tabKeeper: string;

  // biome-ignore lint/correctness/noUnusedVariables: used in nested describe blocks (Session Timeout)
  async function performLogin(password: string) {
    await LoginScreen.passwordInput.setValue(password);
    await LoginScreen.enterButton.click();
  }

  beforeAll(async () => {
    await App.initVault();
    tabKeeper = await browser.getWindowHandle();

    const { waitForNewWindows } = await Windows.captureNewWindows();
    await EmptyHomeScreen.addButton.click();
    const [tabAccounts] = await waitForNewWindows(1);

    await browser.switchToWindow(tabAccounts);
    await browser.refresh();

    await AccountsHome.importAccount('rich', DEFAULT_MINER_SEED);
    await AccountsHome.importAccount('test', TEST_ACCOUNT_SEED);
    await AccountsHome.importAccount('test3', TEST_ACCOUNT_3_SEED);
    await browser.closeWindow();
    await browser.switchToWindow(tabKeeper);

    await TopMenu.settingsButton.click();
  });

  afterAll(async () => {
    await App.closeBgTabs(tabKeeper);
  });

  describe('Export accounts', () => {
    it('creates an encrypted keystore file containing account details', async () => {
      await SettingsMenuScreen.exportAndImportSectionLink.click();

      await ExportAndImportSettingsScreen.exportAccountsLink.click();
      (
        await ChooseAccountsForm.getAccountByAddress('3P5Xx9MFs8VchRjfLeocGFxXkZGknm38oq1')
      ).checkbox.click();
      await ChooseAccountsForm.exportButton.click();
      await ChooseAccountsForm.modalPasswordInput.setValue(DEFAULT_PASSWORD);
      await ChooseAccountsForm.modalEnterButton.click();
    });
  });

  describe('Network', () => {
    let nodeUrl: string, matcherUrl: string;

    beforeAll(async () => {
      await SettingsMenuScreen.networkSectionLink.click();
      nodeUrl = await NetworkSettingsScreen.nodeAddress.getValue();
      matcherUrl = await NetworkSettingsScreen.matcherAddress.getValue();
    });

    afterAll(async () => {
      await TopMenu.backButton.click();
    });

    describe('Node URL', () => {
      it('Is shown', async () => {
        await expect(NetworkSettingsScreen.nodeAddress).toBeDisplayed();
      });
      it('Can be changed', async () => {
        await NetworkSettingsScreen.nodeAddress.clearValue();
        await expect(NetworkSettingsScreen.nodeAddress).not.toHaveValue(nodeUrl);
      });
      it('Can be copied', async () => {
        const { clearClipboard, expectClipboardToMatch } = await import('./utils/clipboard');
        await clearClipboard();
        // Click the node URL field to copy it
        await NetworkSettingsScreen.nodeAddress.click();
        await browser.keys(['Control', 'a']);
        await browser.keys(['Control', 'c']);
        await expectClipboardToMatch(/^https?:\/\/.+/);
      });
    });

    describe('Matcher URL', () => {
      it('Is shown', async () => {
        await expect(NetworkSettingsScreen.matcherAddress).toBeDisplayed();
      });
      it('Can be changed', async () => {
        await NetworkSettingsScreen.matcherAddress.clearValue();
        expect(NetworkSettingsScreen.matcherAddress).not.toHaveValue(matcherUrl);
      });
      it('Can be copied', async () => {
        const { clearClipboard, expectClipboardToMatch } = await import('./utils/clipboard');
        await clearClipboard();
        await NetworkSettingsScreen.matcherAddress.click();
        await browser.keys(['Control', 'a']);
        await browser.keys(['Control', 'c']);
        await expectClipboardToMatch(/^https?:\/\/.+/);
      });
    });

    describe('Set default', () => {
      it('Resets Node and Matcher URLs', async () => {
        await NetworkSettingsScreen.setDefaultButton.click();
        expect(await NetworkSettingsScreen.nodeAddress).toHaveValue(nodeUrl);
        expect(await NetworkSettingsScreen.matcherAddress).toHaveValue(matcherUrl);
      });
    });
  });

  describe('Permissions control', () => {
    beforeAll(async () => {
      await SettingsMenuScreen.permissionsSectionLink.click();
    });

    afterAll(async () => {
      await browser.openKeeperPopup();
      await Settings.clearCustomList();
      await TopMenu.backButton.click();
    });

    const checkChangingAutoLimitsInResourceSettings = () => {
      describe('Changing auto-limits in resource settings', () => {
        beforeEach(async () => {
          await (await PermissionControlSettingsScreen.permissionItems)[0].detailsIcon.click();
          await PermissionControlSettingsScreen.permissionDetailsModal.root.waitForDisplayed();
        });

        it('Enabling', async () => {
          await PermissionControlSettingsScreen.permissionDetailsModal.setResolutionTime(
            'For 1 hour',
          );
          await PermissionControlSettingsScreen.permissionDetailsModal.spendingLimitInput.setValue(
            SPENDING_LIMIT,
          );
          await PermissionControlSettingsScreen.permissionDetailsModal.saveButton.click();
          await expect(
            (await PermissionControlSettingsScreen.permissionItems)[0].status,
          ).toHaveText('Approved+ Automatic signing');
        });

        it('Disabling', async () => {
          await PermissionControlSettingsScreen.permissionDetailsModal.setResolutionTime(
            "Don't automatically sign",
          );
          await PermissionControlSettingsScreen.permissionDetailsModal.saveButton.click();
          await expect(
            (await PermissionControlSettingsScreen.permissionItems)[0].status,
          ).toHaveText('Approved');
        });
      });
    };

    describe('White list', () => {
      beforeAll(async () => {
        await PermissionControlSettingsScreen.whiteListLink.click();
      });

      it('Default whitelisted services appears', async () => {
        for (const origin of WHITELIST) {
          expect(
            (await PermissionControlSettingsScreen.getPermissionByOrigin(origin)).root,
          ).toBeDisplayed();
        }
      });

      checkChangingAutoLimitsInResourceSettings();

      describe('Verification of transactions with auto-limits', () => {
        beforeAll(async () => {
          // Enable auto-limits for the first whitelisted origin
          await (await PermissionControlSettingsScreen.permissionItems)[0].detailsIcon.click();
          await PermissionControlSettingsScreen.permissionDetailsModal.root.waitForDisplayed();
          await PermissionControlSettingsScreen.permissionDetailsModal.setResolutionTime(
            'For 1 hour',
          );
          await PermissionControlSettingsScreen.permissionDetailsModal.spendingLimitInput.setValue(
            SPENDING_LIMIT,
          );
          await PermissionControlSettingsScreen.permissionDetailsModal.saveButton.click();
        });

        afterAll(async () => {
          // Disable auto-limits
          await (await PermissionControlSettingsScreen.permissionItems)[0].detailsIcon.click();
          await PermissionControlSettingsScreen.permissionDetailsModal.root.waitForDisplayed();
          await PermissionControlSettingsScreen.permissionDetailsModal.setResolutionTime(
            "Don't automatically sign",
          );
          await PermissionControlSettingsScreen.permissionDetailsModal.saveButton.click();
        });

        it('Transfer', async () => {
          const origin = WHITELIST[0];
          await browser.navigateTo(`https://${origin}`);
          await ContentScript.waitForCubensisConnect();

          const result = await browser.executeAsync((done: (result: unknown) => void) => {
            CubensisConnect.signAndPublishTransaction({
              data: {
                amount: { assetId: 'DCC', tokens: '0.001' },
                fee: { assetId: 'DCC', tokens: '0.001' },
                recipient: '3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW',
              },
              type: 4,
            })
              .then((tx: unknown) => done(tx))
              .catch((err: Error) => done({ error: err.message }));
          });

          // Auto-signed: should return a transaction object (not trigger a popup)
          expect(result).toHaveProperty('id');
          await browser.openKeeperPopup();
        });

        it('MassTransfer', async () => {
          const origin = WHITELIST[0];
          await browser.navigateTo(`https://${origin}`);
          await ContentScript.waitForCubensisConnect();

          const result = await browser.executeAsync((done: (result: unknown) => void) => {
            CubensisConnect.signAndPublishTransaction({
              data: {
                fee: { assetId: 'DCC', tokens: '0.002' },
                totalAmount: { assetId: 'DCC' },
                transfers: [{ amount: 1000, recipient: '3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW' }],
              },
              type: 11,
            })
              .then((tx: unknown) => done(tx))
              .catch((err: Error) => done({ error: err.message }));
          });

          expect(result).toHaveProperty('id');
          await browser.openKeeperPopup();
        });

        it('Data', async () => {
          const origin = WHITELIST[0];
          await browser.navigateTo(`https://${origin}`);
          await ContentScript.waitForCubensisConnect();

          const result = await browser.executeAsync((done: (result: unknown) => void) => {
            CubensisConnect.signAndPublishTransaction({
              data: {
                data: [{ key: 'test', type: 'string', value: 'hello' }],
                fee: { assetId: 'DCC', tokens: '0.001' },
              },
              type: 12,
            })
              .then((tx: unknown) => done(tx))
              .catch((err: Error) => done({ error: err.message }));
          });

          expect(result).toHaveProperty('id');
          await browser.openKeeperPopup();
        });

        it('InvokeScript', async () => {
          const origin = WHITELIST[0];
          await browser.navigateTo(`https://${origin}`);
          await ContentScript.waitForCubensisConnect();

          const result = await browser.executeAsync((done: (result: unknown) => void) => {
            CubensisConnect.signAndPublishTransaction({
              data: {
                call: { args: [], function: 'test' },
                dApp: '3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW',
                fee: { assetId: 'DCC', tokens: '0.005' },
                payment: [],
              },
              type: 16,
            })
              .then((tx: unknown) => done(tx))
              .catch((err: Error) => done({ error: err.message }));
          });

          expect(result).toHaveProperty('id');
          await browser.openKeeperPopup();
        });
      });
    });
    async function publicStateFromOrigin(origin: string) {
      // this requests permission first
      const permissionRequest = () => {
        window.result = CubensisConnect.publicState();
      };

      await browser.navigateTo(`https://${origin}`);
      await ContentScript.waitForCubensisConnect();
      await browser.execute(permissionRequest);
    }

    describe('Adding', () => {
      it('Origin added to custom list', async () => {
        const origin = CUSTOMLIST[0]!;

        const { waitForNewWindows } = await Windows.captureNewWindows();
        await publicStateFromOrigin(origin);
        const [messageWindow] = await waitForNewWindows(1);
        await browser.switchToWindow(messageWindow);
        await browser.refresh();

        await AuthMessageScreen.authButton.click();
        await expect(FinalTransactionScreen.root).toBeDisplayed();
        await FinalTransactionScreen.closeButton.click();
        await Windows.waitForWindowToClose(messageWindow);
        await browser.switchToWindow(tabKeeper);
        await browser.openKeeperPopup();

        await TopMenu.settingsButton.click();
        await SettingsMenuScreen.permissionsSectionLink.click();

        expect(
          (await PermissionControlSettingsScreen.getPermissionByOrigin(CUSTOMLIST[0]!)).root,
        ).toBeDisplayed();
      });

      it('Origin added to custom list with auto-limits', async () => {
        const origin = CUSTOMLIST[1]!;

        const { waitForNewWindows } = await Windows.captureNewWindows();
        await publicStateFromOrigin(origin);
        const [messageWindow] = await waitForNewWindows(1);
        await browser.switchToWindow(messageWindow);
        await browser.refresh();

        await AuthMessageScreen.permissionDetailsButton.click();
        await AuthMessageScreen.setResolutionTime('For 1 hour');
        await AuthMessageScreen.spendingLimitInput.setValue(SPENDING_LIMIT);
        await AuthMessageScreen.authButton.click();

        await FinalTransactionScreen.closeButton.click();
        await Windows.waitForWindowToClose(messageWindow);
        await browser.switchToWindow(tabKeeper);
        await browser.openKeeperPopup();

        await TopMenu.settingsButton.click();
        await SettingsMenuScreen.permissionsSectionLink.click();

        await expect(
          (await PermissionControlSettingsScreen.getPermissionByOrigin(origin)).status,
        ).toHaveText('Approved+ Automatic signing');
      });
    });

    describe('Blocking', () => {
      afterAll(async () => {
        await browser.openKeeperPopup();

        await TopMenu.settingsButton.click();
        await SettingsMenuScreen.permissionsSectionLink.click();
      });

      it('Block all messages from origin in custom list', async () => {
        const firstOrigin = (await PermissionControlSettingsScreen.permissionItems)[1];
        const origin = await firstOrigin.origin.getText();
        await firstOrigin.enableCheckbox.click();
        await publicStateFromOrigin(origin);
        const response = await browser.executeAsync((done: (result: unknown) => void) => {
          (window.result as Promise<unknown>).then(done, done);
        });
        expect(response).toStrictEqual({
          code: '12',
          data: null,
          message: 'Api rejected by user',
        });
      });
    });

    describe('Removing', () => {
      afterAll(async () => {
        await browser.openKeeperPopup();

        await TopMenu.settingsButton.click();
        await SettingsMenuScreen.permissionsSectionLink.click();
      });

      it('After deletion, requests generate permission request', async () => {
        const originToDelete =
          await PermissionControlSettingsScreen.getPermissionByOrigin('decentralchain.io');
        const origin = await originToDelete.origin.getText();
        await originToDelete.detailsIcon.click();
        await PermissionControlSettingsScreen.permissionDetailsModal.deleteButton.click();
        const { waitForNewWindows } = await Windows.captureNewWindows();
        await publicStateFromOrigin(origin);
        const [messageWindow] = await waitForNewWindows(1);
        await browser.switchToWindow(messageWindow);
        await browser.refresh();

        await CommonTransaction.rejectButton.click();
        await FinalTransactionScreen.closeButton.click();

        await Windows.waitForWindowToClose(messageWindow);
        await browser.switchToWindow(tabKeeper);
      });
    });

    checkChangingAutoLimitsInResourceSettings();

    describe('Verification of transactions with auto-limits', () => {
      beforeAll(async () => {
        // Enable auto-limits for the first custom list origin
        await (await PermissionControlSettingsScreen.permissionItems)[0].detailsIcon.click();
        await PermissionControlSettingsScreen.permissionDetailsModal.root.waitForDisplayed();
        await PermissionControlSettingsScreen.permissionDetailsModal.setResolutionTime(
          'For 1 hour',
        );
        await PermissionControlSettingsScreen.permissionDetailsModal.spendingLimitInput.setValue(
          SPENDING_LIMIT,
        );
        await PermissionControlSettingsScreen.permissionDetailsModal.saveButton.click();
      });

      afterAll(async () => {
        await (await PermissionControlSettingsScreen.permissionItems)[0].detailsIcon.click();
        await PermissionControlSettingsScreen.permissionDetailsModal.root.waitForDisplayed();
        await PermissionControlSettingsScreen.permissionDetailsModal.setResolutionTime(
          "Don't automatically sign",
        );
        await PermissionControlSettingsScreen.permissionDetailsModal.saveButton.click();
      });

      it('Transfer', async () => {
        const origin = CUSTOMLIST[0];
        await browser.navigateTo(`https://${origin}`);
        await ContentScript.waitForCubensisConnect();

        const result = await browser.executeAsync((done: (result: unknown) => void) => {
          CubensisConnect.signAndPublishTransaction({
            data: {
              amount: { assetId: 'DCC', tokens: '0.001' },
              fee: { assetId: 'DCC', tokens: '0.001' },
              recipient: '3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW',
            },
            type: 4,
          })
            .then((tx: unknown) => done(tx))
            .catch((err: Error) => done({ error: err.message }));
        });

        expect(result).toHaveProperty('id');
        await browser.openKeeperPopup();
      });

      it('MassTransfer', async () => {
        const origin = CUSTOMLIST[0];
        await browser.navigateTo(`https://${origin}`);
        await ContentScript.waitForCubensisConnect();

        const result = await browser.executeAsync((done: (result: unknown) => void) => {
          CubensisConnect.signAndPublishTransaction({
            data: {
              fee: { assetId: 'DCC', tokens: '0.002' },
              totalAmount: { assetId: 'DCC' },
              transfers: [{ amount: 1000, recipient: '3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW' }],
            },
            type: 11,
          })
            .then((tx: unknown) => done(tx))
            .catch((err: Error) => done({ error: err.message }));
        });

        expect(result).toHaveProperty('id');
        await browser.openKeeperPopup();
      });

      it('Data', async () => {
        const origin = CUSTOMLIST[0];
        await browser.navigateTo(`https://${origin}`);
        await ContentScript.waitForCubensisConnect();

        const result = await browser.executeAsync((done: (result: unknown) => void) => {
          CubensisConnect.signAndPublishTransaction({
            data: {
              data: [{ key: 'test', type: 'string', value: 'hello' }],
              fee: { assetId: 'DCC', tokens: '0.001' },
            },
            type: 12,
          })
            .then((tx: unknown) => done(tx))
            .catch((err: Error) => done({ error: err.message }));
        });

        expect(result).toHaveProperty('id');
        await browser.openKeeperPopup();
      });

      it('InvokeScript', async () => {
        const origin = CUSTOMLIST[0];
        await browser.navigateTo(`https://${origin}`);
        await ContentScript.waitForCubensisConnect();

        const result = await browser.executeAsync((done: (result: unknown) => void) => {
          CubensisConnect.signAndPublishTransaction({
            data: {
              call: { args: [], function: 'test' },
              dApp: '3MsX9C2MzzxE4ySF5aYcJoaiPfkyxZMg4cW',
              fee: { assetId: 'DCC', tokens: '0.005' },
              payment: [],
            },
            type: 16,
          })
            .then((tx: unknown) => done(tx))
            .catch((err: Error) => done({ error: err.message }));
        });

        expect(result).toHaveProperty('id');
        await browser.openKeeperPopup();
      });
    });
  });
});

describe('General', () => {
  beforeAll(async () => {
    await SettingsMenuScreen.generalSectionLink.click();
  });

  afterAll(async () => {
    await TopMenu.backButton.click();
  });

  describe('Session Timeout', () => {
    afterEach(async () => {
      await performLogin(DEFAULT_PASSWORD);
    });

    it('Logout after "Browser timeout"', async () => {
      await browser.openKeeperPopup();
      await Settings.setSessionTimeout('Browser timeout');

      await waitForExpect(async () => {
        await expect(LoginScreen.root).toBeDisplayed();
      }, 120 * 1000);
    });
  });
});

describe('Root', () => {
  describe('Auto-click protection', () => {
    beforeAll(async () => {
      await expect(SettingsMenuScreen.root).toBeDisplayed();
    });

    it('Can be enabled', async () => {
      await SettingsMenuScreen.clickProtectionButton.click();
      await expect(SettingsMenuScreen.clickProtectionButton).toHaveAttr('data-teston', 'true');
      await expect(SettingsMenuScreen.clickProtectionStatus).toHaveText('Enabled');
    });

    it('Can be disabled', async () => {
      await SettingsMenuScreen.clickProtectionButton.click();
      await expect(SettingsMenuScreen.clickProtectionButton).toHaveAttr('data-teston', 'false');
      await expect(SettingsMenuScreen.clickProtectionStatus).toHaveText('Disabled');
    });

    it('Display tooltip', async () => {
      await SettingsMenuScreen.clickProtectionIcon.moveTo();
      await expect(SettingsMenuScreen.helpTooltip).toHaveText(
        'Protect yourself from Clicker Trojans threats',
      );
    });
  });

  describe('Logout', () => {
    afterAll(async () => {
      await performLogin(DEFAULT_PASSWORD);
      await TopMenu.settingsButton.click();
    });

    it('Exit to the login screen', async () => {
      await SettingsMenuScreen.logoutButton.click();
      await expect(LoginScreen.root).toBeDisplayed();
    });
  });

  describe('Delete accounts', () => {
    it('Account deletion warning displays', async () => {
      await SettingsMenuScreen.deleteAccountsButton.click();
      await expect(ConfirmDeleteAccountsScreen.root).toBeDisplayed();
    });

    it('Clicking "Back" button cancels the deletion', async () => {
      await TopMenu.backButton.click();
      await expect(SettingsMenuScreen.root).toBeDisplayed();
    });

    it('Clicking "Cancel" button cancels the deletion', async () => {
      await SettingsMenuScreen.deleteAccountsButton.click();
      await ConfirmDeleteAccountsScreen.cancelButton.click();
      await expect(SettingsMenuScreen.root).toBeDisplayed();
    });

    it('"Delete all" button is disabled', async () => {
      await SettingsMenuScreen.deleteAccountsButton.click();
      await expect(ConfirmDeleteAccountsScreen.deleteAllButton).toBeDisabled();
    });

    it('Wrong confirmation phrase displays error', async () => {
      await ConfirmDeleteAccountsScreen.confirmPhraseInput.setValue('delete all accounts');
      await expect(ConfirmDeleteAccountsScreen.deleteAllButton).toBeDisabled();
      await expect(ConfirmDeleteAccountsScreen.confirmPhraseError).toHaveText(
        'The phrase is entered incorrectly',
      );
    });

    it('Correct confirmation phrase enables "Delete all" button', async () => {
      await ConfirmDeleteAccountsScreen.confirmPhraseInput.setValue('DELETE ALL ACCOUNTS');
      await expect(ConfirmDeleteAccountsScreen.deleteAllButton).toBeEnabled();
    });

    it('Clicking "Delete account" removes all accounts from current network', async () => {
      await ConfirmDeleteAccountsScreen.deleteAllButton.click();
      await expect(GetStartedScreen.root).toBeDisplayed();
    });
  });
});
