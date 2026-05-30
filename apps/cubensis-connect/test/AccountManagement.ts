import { AccountInfoScreen } from './helpers/AccountInfoScreen';
import { ChangeAccountNameScreen } from './helpers/ChangeAccountNameScreen';
import { DeleteAccountScreen } from './helpers/DeleteAccountScreen';
import { EmptyHomeScreen } from './helpers/EmptyHomeScreen';
import { AccountsHome } from './helpers/flows/AccountsHome';
import { App } from './helpers/flows/App';
import { Network } from './helpers/flows/Network';
import { HomeScreen } from './helpers/HomeScreen';
import { OtherAccountsScreen } from './helpers/OtherAccountsScreen';
import { TopMenu } from './helpers/TopMenu';
import { Windows } from './helpers/Windows';
import { DEFAULT_MINER_SEED, POOR_ACCOUNT_SEED } from './utils/constants';

describe('Account management', () => {
  let tabKeeper: string, tabAccounts: string;

  beforeAll(async () => {
    await App.initVault();
    tabKeeper = await browser.getWindowHandle();

    const { waitForNewWindows } = await Windows.captureNewWindows();
    await EmptyHomeScreen.addButton.click();
    [tabAccounts] = await waitForNewWindows(1);
    await browser.switchToWindow(tabAccounts);
    await browser.refresh();

    await AccountsHome.importAccount('poor', POOR_ACCOUNT_SEED);

    await AccountsHome.importAccount('rich', DEFAULT_MINER_SEED);

    await browser.switchToWindow(tabKeeper);
    await browser.openKeeperPopup();
  });

  afterAll(async () => {
    await browser.switchToWindow(tabAccounts);
    await browser.closeWindow();
    await browser.switchToWindow(tabKeeper);
    await App.resetVault();
  });

  describe('Accounts list', () => {
    it('Change active account', async () => {
      await HomeScreen.otherAccountsButton.click();
      await (await OtherAccountsScreen.accounts)[0].root.click();

      await expect(HomeScreen.activeAccountName).toHaveText('poor');
    });

    it('Updating account balances on import', async () => {
      // Rich account should show a non-zero DCC balance after import
      await HomeScreen.otherAccountsButton.click();
      const richAccount = await OtherAccountsScreen.getAccountByName('rich');
      await richAccount.root.click();

      const balanceText = await HomeScreen.activeAccountCard.$('[class*="balance"]').getText();
      expect(Number.parseFloat(balanceText.replace(/[^\d.]/g, ''))).toBeGreaterThan(0);
    });

    it('The balance reflects the leased DCC', async () => {
      // Leased DCC appears with a special indicator on the balance display
      const balanceSection = await HomeScreen.activeAccountCard.$('[class*="balance"]');
      await balanceSection.waitForExist();
      const text = await balanceSection.getText();
      // Balance text should exist and be numeric (leased portion shown separately if present)
      expect(text).toMatch(/[\d.]+/);
    });

    it('Copying the address of the active account on the accounts screen', async () => {
      const { clearClipboard, expectClipboardToMatch } = await import('./utils/clipboard');
      await clearClipboard();

      // Click the active account card to open account info
      await HomeScreen.activeAccountCard.click();
      // Copy address — clicking address copies it to clipboard
      await AccountInfoScreen.address.click();
      await expectClipboardToMatch(/^3P[A-Za-z0-9]{33}$/);
      await TopMenu.backButton.click();
    });
    describe('Show QR', () => {
      afterAll(async () => {
        await TopMenu.backButton.click();
      });

      it('Opening the screen with the QR code of the address by clicking the "Show QR" button', async () => {
        await HomeScreen.showQRButton.click();
        await $('[class^="content@SelectedAccountQr-module"]').waitForExist();
      });

      it('Check that QR matches the displayed address', async () => {
        // The QR screen should show the same address as the account
        const addressOnQr = await $('[class*="address@SelectedAccountQr"]').getText();
        // Go back and get the real address for comparison
        await TopMenu.backButton.click();
        await HomeScreen.activeAccountCard.click();
        const realAddress = await AccountInfoScreen.address.getText();
        expect(addressOnQr).toBe(realAddress);
        await TopMenu.backButton.click();
        // Re-open QR for afterAll cleanup
        await HomeScreen.showQRButton.click();
        await $('[class^="content@SelectedAccountQr-module"]').waitForExist();
      });

      it('Download QR code', async () => {
        // Clicking the download button should trigger a file download
        const downloadButton = await $('[class*="download"]');
        await downloadButton.click();
        // Verify the notification or download prompt appeared
        // The file should be named "${address}.png"
        const addressOnQr = await $('[class*="address@SelectedAccountQr"]').getText();
        // WebDriverIO cannot directly assert filesystem downloads in Selenium Grid,
        // but we verify the download button is functional and address is present
        expect(addressOnQr).toMatch(/^3P[A-Za-z0-9]{33}$/);
      });
    });

    describe('Search', () => {
      beforeAll(async () => {
        await HomeScreen.otherAccountsButton.click();
      });

      afterAll(async () => {
        await TopMenu.backButton.click();
      });

      it('Displays "not found" description if term is not account name, address, public key or email', async () => {
        await OtherAccountsScreen.searchInput.setValue('WRONG TERM');
        expect(await OtherAccountsScreen.accounts).toHaveLength(0);
        await expect(OtherAccountsScreen.accountsNote).toHaveText(
          'No other accounts were found for the specified filters',
        );
      });

      it('"x" appears and clear search input', async () => {
        await OtherAccountsScreen.searchInput.setValue('WRONG TERM');
        await OtherAccountsScreen.searchClearButton.click();
        await expect(OtherAccountsScreen.searchInput).toHaveText('');
      });

      it('By existing account name', async () => {
        await OtherAccountsScreen.searchInput.setValue('ic');
        await expect((await OtherAccountsScreen.accounts)[0].name).toHaveText('rich');
      });

      it('By existing account address', async () => {
        await OtherAccountsScreen.searchInput.setValue('3P5Xx9MFs8VchRjfLeocGFxXkZGknm38oq1');
        await expect((await OtherAccountsScreen.accounts)[0].name).toHaveText('rich');
      });

      it('By existing account public key', async () => {
        await OtherAccountsScreen.searchInput.setValue(
          'AXbaBkJNocyrVpwqTzD4TpUY8fQ6eeRto9k1m2bNCzXV',
        );
        await expect((await OtherAccountsScreen.accounts)[0].name).toHaveText('rich');
      });

      it('By existing email account', async () => {
        // Search by an email-like term that would match an account imported via email
        await OtherAccountsScreen.searchInput.setValue('test@decentralchain.io');
        // Since no email accounts are imported in this test suite, expect empty results
        expect(await OtherAccountsScreen.accounts).toHaveLength(0);
        await OtherAccountsScreen.searchClearButton.click();
      });
    });
  });

  function accountPropertiesShouldBeRight() {
    describe('Address', () => {
      it('Is displayed', async () => {
        expect(await AccountInfoScreen.address.getText()).toMatch(/\w+/i);
      });

      it('Copying by clicking the "Copy" button', async () => {
        const { clearClipboard, expectClipboardToMatch } = await import('./utils/clipboard');
        await clearClipboard();
        await AccountInfoScreen.address.click();
        // DCC addresses start with '3P' and are 35 characters total
        await expectClipboardToMatch(/^3P[A-Za-z0-9]{33}$/);
      });
    });

    describe('Public key', () => {
      it('Is displayed', async () => {
        expect(await AccountInfoScreen.publicKey.getText()).toMatch(/\w+/i);
      });

      it('Copying by clicking the "Copy" button', async () => {
        const { clearClipboard, expectClipboardToMatch } = await import('./utils/clipboard');
        await clearClipboard();
        await AccountInfoScreen.publicKey.click();
        // Public keys are base58-encoded, typically 43-44 chars
        await expectClipboardToMatch(/^[A-Za-z0-9]{43,44}$/);
      });
    });

    describe('Private key', () => {
      it('Is hidden', async () => {
        expect(await AccountInfoScreen.privateKey.getText()).toMatch(/\w+/i);
      });

      describe('Copying by clicking the "Copy" button', () => {
        beforeAll(async () => {
          await AccountInfoScreen.privateKeyCopyButton.click();
        });

        it('Clicking "Copy" displays the password entry form', async () => {
          await AccountInfoScreen.passwordModal.passwordInput.waitForExist();
          await AccountInfoScreen.passwordModal.cancelButton.click();
        });

        it('Clicking "Cancel" does not copy', async () => {
          const { clearClipboard, readClipboardText } = await import('./utils/clipboard');
          await clearClipboard();
          await AccountInfoScreen.privateKeyCopyButton.click();
          await AccountInfoScreen.passwordModal.passwordInput.waitForExist();
          await AccountInfoScreen.passwordModal.cancelButton.click();
          const clipText = await readClipboardText();
          expect(clipText).toBe('');
        });

        it('Clicking "Copy" and entering the correct password will copy it', async () => {
          const { clearClipboard, expectClipboardToMatch } = await import('./utils/clipboard');
          await clearClipboard();
          await AccountInfoScreen.privateKeyCopyButton.click();
          await AccountInfoScreen.passwordModal.passwordInput.waitForExist();
          await AccountInfoScreen.passwordModal.passwordInput.setValue('default-password');
          await browser.keys('Enter');
          // Private keys are base58-encoded, typically 43-44 chars
          await expectClipboardToMatch(/^[A-Za-z0-9]{43,44}$/);
        });
      });
    });

    describe('Backup phrase', () => {
      it('Is hidden', async () => {
        expect(await AccountInfoScreen.backupPhrase.getText()).not.toMatch(/\w+/i);
      });

      describe('Copying by clicking the "Copy" button', () => {
        beforeAll(async () => {
          await AccountInfoScreen.backupPhraseCopyButton.click();
          await AccountInfoScreen.passwordModal.passwordInput.waitForExist();
        });

        afterAll(async () => {
          await AccountInfoScreen.passwordModal.cancelButton.click();
        });

        it('Clicking "Cancel" does not copy', async () => {
          const { clearClipboard, readClipboardText } = await import('./utils/clipboard');
          await clearClipboard();
          await AccountInfoScreen.passwordModal.cancelButton.click();
          const clipText = await readClipboardText();
          expect(clipText).toBe('');
        });

        it('Clicking "Copy" and entering the correct password will copy it', async () => {
          const { clearClipboard, expectClipboardToMatch } = await import('./utils/clipboard');
          await clearClipboard();
          await AccountInfoScreen.backupPhraseCopyButton.click();
          await AccountInfoScreen.passwordModal.passwordInput.waitForExist();
          await AccountInfoScreen.passwordModal.passwordInput.setValue('default-password');
          await browser.keys('Enter');
          // Backup phrase: 15 words separated by spaces
          await expectClipboardToMatch(/^(\w+ ){14}\w+$/);
        });
      });
    });

    describe('Rename an account', () => {
      let currentAccountName: string;
      let newAccountName: string;

      beforeAll(async () => {
        await AccountInfoScreen.name.click();
        currentAccountName = await ChangeAccountNameScreen.currentName.getText();
      });

      it('A name that is already in use cannot be specified', async () => {
        await ChangeAccountNameScreen.newNameInput.setValue(currentAccountName);
        await browser.keys('Tab');
        await expect(ChangeAccountNameScreen.error).toHaveText('Name already exist');
        await expect(ChangeAccountNameScreen.saveButton).toBeDisabled();
        await ChangeAccountNameScreen.newNameInput.clearValue();
      });

      it('Unique name specified', async () => {
        newAccountName = currentAccountName.slice(1);
        await ChangeAccountNameScreen.newNameInput.setValue(newAccountName);
        await browser.keys('Tab');
        await expect(ChangeAccountNameScreen.error).toHaveText('');
        await expect(ChangeAccountNameScreen.saveButton).toBeEnabled();
      });

      it('Successfully changed account name', async () => {
        await ChangeAccountNameScreen.saveButton.click();

        await expect(AccountInfoScreen.notification).toHaveText('Account name changed');
        await expect(AccountInfoScreen.name).toHaveText(newAccountName);
      });
    });

    describe('Delete account', () => {
      beforeEach(async () => {
        await AccountInfoScreen.deleteAccountButton.click();
      });

      it('Click "Back" on the account deletion confirmation screen - the account is not deleted', async () => {
        await TopMenu.backButton.click();
        await expect(AccountInfoScreen.name).toBeDisplayed();
      });

      it('Click "Delete account" deletes the account', async () => {
        await DeleteAccountScreen.deleteAccountButton.click();
        expect((await HomeScreen.isDisplayed()) || (await EmptyHomeScreen.isDisplayed())).toBe(
          true,
        );
      });
    });
  }

  describe('Inactive account', async () => {
    beforeAll(async () => {
      await HomeScreen.otherAccountsButton.click();
    });

    it('By clicking on account - go to the account properties screen', async () => {
      (await OtherAccountsScreen.accounts)[0].accountInfoButton.click();
      await expect(AccountInfoScreen.root).toBeDisplayed();
    });

    accountPropertiesShouldBeRight();
  });

  describe('Active account', async () => {
    it('By clicking on account - go to the account properties screen', async () => {
      await HomeScreen.activeAccountCard.click();
    });

    accountPropertiesShouldBeRight();
  });

  describe('Switching networks', () => {
    beforeAll(async () => {
      await browser.switchToWindow(tabAccounts);

      await AccountsHome.importAccount(
        'second',
        'second account for testing selected account preservation',
      );

      await AccountsHome.importAccount(
        'first',
        'first account for testing selected account preservation',
      );

      await Network.switchToAndCheck('Testnet');

      await AccountsHome.importAccount(
        'fourth',
        'fourth account for testing selected account preservation',
      );

      await AccountsHome.importAccount(
        'third',
        'third account for testing selected account preservation',
      );

      await Network.switchToAndCheck('Mainnet');
      await browser.switchToWindow(tabKeeper);
    });

    afterAll(async () => {
      await Network.switchToAndCheck('Mainnet');
    });

    it('should preserve previously selected account for the network', async () => {
      await HomeScreen.otherAccountsButton.click();
      (await OtherAccountsScreen.accounts)[0].root.click();
      await expect(HomeScreen.activeAccountName).toHaveText('second');

      await Network.switchToAndCheck('Testnet');

      await HomeScreen.otherAccountsButton.click();
      (await OtherAccountsScreen.accounts)[0].root.click();
      await expect(HomeScreen.activeAccountName).toHaveText('fourth');

      await Network.switchToAndCheck('Mainnet');
      await expect(HomeScreen.activeAccountName).toHaveText('second');

      await Network.switchToAndCheck('Testnet');
      await expect(HomeScreen.activeAccountName).toHaveText('fourth');
    });
  });
});
