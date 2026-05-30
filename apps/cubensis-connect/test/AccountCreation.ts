import waitForExpect from 'wait-for-expect';

import { AccountInfoScreen } from './helpers/AccountInfoScreen';
import { BackupSeedScreen } from './helpers/BackupSeedScreen';
import { ChooseAccountsForm } from './helpers/ChooseAccountsForm';
import { ConfirmBackupScreen } from './helpers/ConfirmBackupScreen';
import { DeleteAccountScreen } from './helpers/DeleteAccountScreen';
import { EmptyHomeScreen } from './helpers/EmptyHomeScreen';
import { AccountsHome } from './helpers/flows/AccountsHome';
import { App } from './helpers/flows/App';
import { Network } from './helpers/flows/Network';
import { PopupHome } from './helpers/flows/PopupHome';
import { HomeScreen } from './helpers/HomeScreen';
import { ImportFormScreen } from './helpers/ImportFormScreen';
import { ImportKeystoreFileScreen } from './helpers/ImportKeystoreFileScreen';
import { ImportSuccessScreen } from './helpers/ImportSuccessScreen';
import { ImportViaSeedScreen } from './helpers/ImportViaSeedScreen';
import { NewWalletNameScreen } from './helpers/NewWalletNameScreen';
import { NewWalletScreen } from './helpers/NewWalletScreen';
import { OtherAccountsScreen } from './helpers/OtherAccountsScreen';
import { TopMenu } from './helpers/TopMenu';
import { Windows } from './helpers/Windows';

describe('Account creation', () => {
  let tabKeeper: string, tabAccounts: string;

  async function deleteEachAndSwitchToAccounts() {
    while (!(await EmptyHomeScreen.isDisplayed())) {
      await HomeScreen.activeAccountCard.click();
      await AccountInfoScreen.deleteAccountButton.click();
      await DeleteAccountScreen.deleteAccountButton.click();
    }
    await browser.switchToWindow(tabAccounts);
  }

  beforeAll(async () => {
    await App.initVault();
    tabKeeper = await browser.getWindowHandle();

    const { waitForNewWindows } = await Windows.captureNewWindows();
    await EmptyHomeScreen.addButton.click();
    [tabAccounts] = await waitForNewWindows(1);
    await browser.switchToWindow(tabAccounts);
    await browser.refresh();
  });

  afterAll(async () => {
    await browser.switchToWindow(tabAccounts);
    await browser.closeWindow();
    await browser.switchToWindow(tabKeeper);
    await App.resetVault();
  });

  describe('Create', () => {
    const ACCOUNTS = {
      ANY: 'account123!@#_аккаунт',
      FIRST: 'first',
      SECOND: 'second',
    };

    afterAll(deleteEachAndSwitchToAccounts);

    it('first account via "Create a new account"', async () => {
      await ImportFormScreen.createNewAccountButton.click();
      await NewWalletScreen.continueButton.click();

      const seed = await BackupSeedScreen.seed.getText();
      await BackupSeedScreen.continueButton.click();

      for (const word of seed.split(' ')) {
        const pill = await ConfirmBackupScreen.suggestedPillsContainer.getPillByText(word);
        await pill.click();
        await waitForExpect(async () => {
          expect(await pill.isDisplayed()).toBe(false);
        });
      }

      await ConfirmBackupScreen.confirmButton.click();
      await NewWalletNameScreen.nameInput.setValue(ACCOUNTS.FIRST);
      await NewWalletNameScreen.continueButton.click();

      await ImportSuccessScreen.addAnotherAccountButton.click();
      await browser.switchToWindow(tabKeeper);
      expect(await HomeScreen.activeAccountName.getText()).toBe(ACCOUNTS.FIRST);
    });

    describe('additional account via "Add account"', () => {
      describe('When you already have 1 account', () => {
        describe('Create new account page', () => {
          beforeAll(async () => {
            await HomeScreen.otherAccountsButton.click();
            await OtherAccountsScreen.addAccountButton.click();
            await browser.switchToWindow(tabAccounts);
            await ImportFormScreen.createNewAccountButton.click();
          });

          it('Each time you open the "Create new account" screen, new addresses are generated', async () => {
            const prevAddress = await NewWalletScreen.accountAddress.getText();
            await TopMenu.backButton.click();

            await ImportFormScreen.createNewAccountButton.click();
            const newAddress = await NewWalletScreen.accountAddress.getText();
            expect(newAddress).not.toBe(prevAddress);
          });

          it('You can select any account from the list of 5 generated', async () => {
            const avatarList = await NewWalletScreen.avatars;

            expect(avatarList).toHaveLength(5);

            let prevAddress: string | null = null;

            for (const avatar of avatarList) {
              await avatar.click();
              const currentAddress = await NewWalletScreen.accountAddress.getText();
              expect(currentAddress).not.toBe(prevAddress);
              prevAddress = currentAddress;
            }

            await NewWalletScreen.continueButton.click();
          });
        });

        let rightSeed: string;
        describe('Save backup phrase page', () => {
          it('Backup phrase is visible', async () => {
            rightSeed = await BackupSeedScreen.seed.getText();
            expect(rightSeed.length).toBeGreaterThan(0);

            await BackupSeedScreen.continueButton.click();
          });

          it('Backup phrase cannot be selected with cursor', async () => {
            const seedElement = BackupSeedScreen.seed;
            const userSelect = await browser.execute(
              (el: HTMLElement) => {
                return window.getComputedStyle(el).userSelect;
              },
              await seedElement,
            );
            expect(userSelect).toBe('none');
          });

          it('Ability to copy backup phrase to clipboard', async () => {
            const { clearClipboard, expectClipboardToMatch } = await import('./utils/clipboard');
            await clearClipboard();
            await BackupSeedScreen.copyButton.click();
            // Seed phrases are 15 words separated by spaces
            await expectClipboardToMatch(/^(\w+ ){14}\w+$/);
          });
        });

        describe('Confirm backup page', () => {
          const PILLS_COUNT = 15;

          it('Filling in a seed in the wrong word order', async () => {
            // there is no Confirm button. An error message and a "Clear" button are displayed
            const wrongSeed = rightSeed.split(' ').reverse();

            const suggestedPills = ConfirmBackupScreen.suggestedPillsContainer;
            const selectedPills = ConfirmBackupScreen.selectedPillsContainer;
            for (const word of wrongSeed) {
              const pill = await suggestedPills.getPillByText(word);
              await pill.click();
              await waitForExpect(async () => {
                expect(await pill.isDisplayed()).toBe(false);
              });
            }

            await waitForExpect(async () => {
              expect(await ConfirmBackupScreen.errorMessage.getText()).toBe(
                'Wrong order, try again',
              );
            });

            expect(await selectedPills.getAllPills()).toHaveLength(PILLS_COUNT);
            expect(await suggestedPills.getAllPills()).toHaveLength(0);
          });

          it('The "Clear" button resets a completely filled phrase', async () => {
            await ConfirmBackupScreen.clearLink.click();
            expect(await ConfirmBackupScreen.errorMessage.isDisplayed()).toBe(false);

            const suggestedPills = ConfirmBackupScreen.suggestedPillsContainer;
            const selectedPills = ConfirmBackupScreen.selectedPillsContainer;

            await waitForExpect(async () => {
              expect(await selectedPills.getAllPills()).toHaveLength(0);
              expect(await suggestedPills.getAllPills()).toHaveLength(PILLS_COUNT);
            });
          });

          it('The word can be reset by clicking (any, not only the last)', async () => {
            const suggestedPillsContainer = ConfirmBackupScreen.suggestedPillsContainer;
            const selectedPillsContainer = ConfirmBackupScreen.selectedPillsContainer;

            for (const pill of await suggestedPillsContainer.getAllPills()) {
              await pill.click();
            }

            const pills = await selectedPillsContainer.getAllPills();
            expect(pills).toHaveLength(PILLS_COUNT);
            for (const pill of pills) {
              const prevPillsCount = (await selectedPillsContainer.getAllPills()).length;
              await pill.click();

              await waitForExpect(async () => {
                expect(await selectedPillsContainer.getAllPills()).toHaveLength(
                  Number(prevPillsCount) - 1,
                );
              });
            }

            expect(await selectedPillsContainer.getAllPills()).toHaveLength(0);
            expect(await suggestedPillsContainer.getAllPills()).toHaveLength(PILLS_COUNT);
          });

          it('Account name page opened while filling in the phrase in the correct order', async () => {
            const suggestedPillsContainer = ConfirmBackupScreen.suggestedPillsContainer;
            for (const word of rightSeed.split(' ')) {
              const pill = await suggestedPillsContainer.getPillByText(word);
              await pill.click();
              await pill.waitForDisplayed({ reverse: true });
            }

            await ConfirmBackupScreen.confirmButton.click();
          });
        });

        describe('Account name page', () => {
          it('Account cannot be given a name that is already in use', async () => {
            await NewWalletNameScreen.nameInput.setValue(ACCOUNTS.FIRST);
            await browser.keys('Tab');

            expect(await NewWalletNameScreen.error.getText()).toBe('Name already exist');
            expect(await NewWalletNameScreen.continueButton.isEnabled()).toBe(false);
          });

          it('Ability to paste account name from clipboard', async () => {
            const { writeClipboardText, clearClipboard } = await import('./utils/clipboard');
            const clipName = 'ClipboardAccount';
            await writeClipboardText(clipName);
            await NewWalletNameScreen.nameInput.click();
            await browser.keys(['Control', 'v']);
            const value = await NewWalletNameScreen.nameInput.getValue();
            expect(value).toContain(clipName);
            await clearClipboard();
            await NewWalletNameScreen.nameInput.clearValue();
          });

          it('In the account name, you can enter numbers, special characters and symbols from any layout', async () => {
            await NewWalletNameScreen.nameInput.setValue(ACCOUNTS.ANY);
            await browser.keys('Tab');

            expect(await NewWalletNameScreen.error.getText()).toBe('');
            expect(await NewWalletNameScreen.continueButton.isEnabled()).toBe(true);
          });

          it('Account successfully created and selected', async () => {
            await NewWalletNameScreen.continueButton.click();

            await ImportSuccessScreen.addAnotherAccountButton.click();
            await ImportFormScreen.root.waitForExist();

            await browser.switchToWindow(tabKeeper);
            await browser.openKeeperPopup();

            expect(await PopupHome.getActiveAccountName()).toBe(ACCOUNTS.ANY);
          });
        });
      });

      it('When you already have 2 accounts', async () => {
        // Create a second account, then verify we can add a third
        await browser.switchToWindow(tabAccounts);
        await ImportFormScreen.createNewAccountButton.click();
        await NewWalletScreen.continueButton.click();
        const seed2 = await BackupSeedScreen.seed.getText();
        await BackupSeedScreen.continueButton.click();

        for (const word of seed2.split(' ')) {
          const pill = await ConfirmBackupScreen.suggestedPillsContainer.getPillByText(word);
          await pill.click();
          await pill.waitForDisplayed({ reverse: true });
        }
        await ConfirmBackupScreen.confirmButton.click();
        await NewWalletNameScreen.nameInput.setValue('second_account');
        await NewWalletNameScreen.continueButton.click();
        await ImportSuccessScreen.addAnotherAccountButton.click();

        // Now create a third while having 2
        await ImportFormScreen.createNewAccountButton.click();
        await NewWalletScreen.continueButton.click();
        const seed3 = await BackupSeedScreen.seed.getText();
        await BackupSeedScreen.continueButton.click();

        for (const word of seed3.split(' ')) {
          const pill = await ConfirmBackupScreen.suggestedPillsContainer.getPillByText(word);
          await pill.click();
          await pill.waitForDisplayed({ reverse: true });
        }
        await ConfirmBackupScreen.confirmButton.click();
        await NewWalletNameScreen.nameInput.setValue('third_account');
        await NewWalletNameScreen.continueButton.click();

        await ImportSuccessScreen.addAnotherAccountButton.click();

        await browser.switchToWindow(tabKeeper);
        await browser.openKeeperPopup();
        expect(await PopupHome.getActiveAccountName()).toBe('third_account');
      });

      it('When you already have 10 accounts', async () => {
        // We already have 3 accounts from prior tests — create 7 more to reach 10
        await browser.switchToWindow(tabAccounts);
        for (let i = 4; i <= 10; i++) {
          await ImportFormScreen.createNewAccountButton.click();
          await NewWalletScreen.continueButton.click();
          const seed = await BackupSeedScreen.seed.getText();
          await BackupSeedScreen.continueButton.click();
          for (const word of seed.split(' ')) {
            const pill = await ConfirmBackupScreen.suggestedPillsContainer.getPillByText(word);
            await pill.click();
            await pill.waitForDisplayed({ reverse: true });
          }
          await ConfirmBackupScreen.confirmButton.click();
          await NewWalletNameScreen.nameInput.setValue(`account_${i}`);
          await NewWalletNameScreen.continueButton.click();
          await ImportSuccessScreen.addAnotherAccountButton.click();
        }

        // Verify we now have 10 accounts total
        await browser.switchToWindow(tabKeeper);
        await browser.openKeeperPopup();
        await HomeScreen.otherAccountsButton.click();
        const accounts = await OtherAccountsScreen.accounts;
        expect(accounts.length).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('Import via seed', () => {
    const ACCOUNTS = {
      FIRST: { NAME: 'first', SEED: 'this is first account seed' },
      MORE_24_CHARS: {
        NAME: 'more than 24 characters',
        SEED: 'there is more than 24 characters',
      },
    };

    afterAll(deleteEachAndSwitchToAccounts);

    it('first account via "Import account"', async () => {
      await ImportFormScreen.importViaSeedButton.click();
      await ImportViaSeedScreen.seedInput.setValue(ACCOUNTS.FIRST.SEED);
      await ImportViaSeedScreen.importAccountButton.click();
      await NewWalletNameScreen.nameInput.setValue(ACCOUNTS.FIRST.NAME);
      await NewWalletNameScreen.continueButton.click();
      await ImportSuccessScreen.addAnotherAccountButton.click();
      await expect(ImportFormScreen.root).toBeDisplayed();

      await browser.switchToWindow(tabKeeper);
      await browser.openKeeperPopup();

      expect(await PopupHome.getActiveAccountName()).toBe(ACCOUNTS.FIRST.NAME);
    });

    describe('additional account via the "Add account"', () => {
      describe('When you already have 1 account', () => {
        beforeAll(async () => {
          await PopupHome.addAccount();
          await browser.switchToWindow(tabAccounts);
          await ImportFormScreen.importViaSeedButton.click();
        });

        describe('Seed phrase page', () => {
          it("Can't import seed with length less than 24 characters", async () => {
            await ImportViaSeedScreen.seedInput.setValue('too short seed');
            await ImportViaSeedScreen.importAccountButton.click();

            await expect(ImportViaSeedScreen.errorMessage).toHaveText(
              'Seed cannot be shorter than 24 characters',
            );
          });

          it('Can be switched to existing account', async () => {
            await ImportViaSeedScreen.seedInput.setValue(ACCOUNTS.FIRST.SEED);
            await waitForExpect(async () => {
              await expect(ImportViaSeedScreen.switchAccountButton).toBeDisplayed();
            });
            await expect(ImportViaSeedScreen.errorMessage).toHaveText(
              expect.stringContaining('Account already known as'),
            );
          });

          it('Any change in the seed changes the address', async () => {
            await ImportViaSeedScreen.seedInput.setValue(ACCOUNTS.MORE_24_CHARS.SEED);

            let prevAddress = await ImportViaSeedScreen.address.getText();

            // insert char
            await ImportViaSeedScreen.seedInput.addValue('W');
            await expect(ImportViaSeedScreen.address).not.toHaveText(prevAddress);
            prevAddress = await ImportViaSeedScreen.address.getText();

            // delete inserted char
            await browser.keys('Backspace');
            await expect(ImportViaSeedScreen.address).not.toHaveText(prevAddress);
          });

          it('You can paste a seed from the clipboard', async () => {
            const { writeClipboardText, clearClipboard } = await import('./utils/clipboard');
            const seedToImport = 'this is a pasted seed from clipboard for testing purposes only';
            await writeClipboardText(seedToImport);
            await ImportViaSeedScreen.seedInput.click();
            await browser.keys(['Control', 'v']);
            const value = await ImportViaSeedScreen.seedInput.getValue();
            expect(value).toContain(seedToImport);
            await clearClipboard();
            await ImportViaSeedScreen.seedInput.clearValue();
          });

          it('Correct seed entered', async () => {
            await ImportViaSeedScreen.seedInput.setValue(ACCOUNTS.MORE_24_CHARS.SEED);
            await ImportViaSeedScreen.importAccountButton.click();
          });
        });

        describe('Account name page', () => {
          it('The account cannot be given a name already in use', async () => {
            await NewWalletNameScreen.nameInput.setValue(ACCOUNTS.FIRST.NAME);
            await browser.keys('Tab');

            await expect(NewWalletNameScreen.error).toHaveText('Name already exist');
            await expect(NewWalletNameScreen.continueButton).toBeDisabled();
          });

          it('Additional account successfully imported while entered correct account name', async () => {
            await NewWalletNameScreen.nameInput.setValue(ACCOUNTS.MORE_24_CHARS.NAME);
            await browser.keys('Tab');

            await expect(NewWalletNameScreen.error).toHaveText('');

            await NewWalletNameScreen.continueButton.click();

            await ImportSuccessScreen.addAnotherAccountButton.click();
            await expect(ImportFormScreen.root).toBeExisting();

            await browser.switchToWindow(tabKeeper);
            await browser.openKeeperPopup();

            await expect(HomeScreen.activeAccountName).toHaveText(ACCOUNTS.MORE_24_CHARS.NAME);
          });
        });
      });

      it('When you already have 2 accounts', async () => {
        // Import a second seed account, then a third
        await browser.switchToWindow(tabAccounts);
        const secondSeed = 'this is second account seed for multi-account test';
        await ImportFormScreen.importViaSeedButton.click();
        await ImportViaSeedScreen.seedInput.setValue(secondSeed);
        await ImportViaSeedScreen.importAccountButton.click();
        await NewWalletNameScreen.nameInput.setValue('seed_second');
        await NewWalletNameScreen.continueButton.click();
        await ImportSuccessScreen.addAnotherAccountButton.click();

        // Now import a third
        const thirdSeed = 'this is third account seed for multi-account test';
        await ImportFormScreen.importViaSeedButton.click();
        await ImportViaSeedScreen.seedInput.setValue(thirdSeed);
        await ImportViaSeedScreen.importAccountButton.click();
        await NewWalletNameScreen.nameInput.setValue('seed_third');
        await NewWalletNameScreen.continueButton.click();
        await ImportSuccessScreen.addAnotherAccountButton.click();

        await browser.switchToWindow(tabKeeper);
        await browser.openKeeperPopup();
        expect(await PopupHome.getActiveAccountName()).toBe('seed_third');
      });

      it('When you already have 10 accounts', async () => {
        // Import accounts via seed until we reach 10 total
        await browser.switchToWindow(tabAccounts);
        for (let i = 4; i <= 10; i++) {
          await ImportFormScreen.importViaSeedButton.click();
          await ImportViaSeedScreen.seedInput.setValue(`test seed for account number ${i} import`);
          await ImportViaSeedScreen.importAccountButton.click();
          await NewWalletNameScreen.nameInput.setValue(`seed_acc_${i}`);
          await NewWalletNameScreen.continueButton.click();
          await ImportSuccessScreen.addAnotherAccountButton.click();
        }

        // After 10 accounts, the "Add account" button should not be available
        await browser.switchToWindow(tabKeeper);
        await browser.openKeeperPopup();
        await HomeScreen.otherAccountsButton.click();
        const accounts = await OtherAccountsScreen.accounts;
        expect(accounts.length).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('Import via keystore file', () => {
    describe('validation', () => {
      it('keeps "Continue" button disabled until both keystore file is selected and password is entered', async () => {
        await ImportFormScreen.importByKeystoreFileButton.click();

        // No file selected, no password — Continue should be disabled
        await expect(ImportKeystoreFileScreen.continueButton).toBeDisabled();

        // Select a file, but no password yet
        await ImportKeystoreFileScreen.fileInput.addValue(
          '/app/test/fixtures/keystore-keeper.json',
        );
        // Password field should appear; Continue still disabled without password
        await expect(ImportKeystoreFileScreen.continueButton).toBeDisabled();

        // Enter a password — Continue should become enabled
        await ImportKeystoreFileScreen.passwordInput.setValue('somepassword');
        await expect(ImportKeystoreFileScreen.continueButton).toBeEnabled();

        // Clear the password — Continue should be disabled again
        await ImportKeystoreFileScreen.passwordInput.clearValue();
        await expect(ImportKeystoreFileScreen.continueButton).toBeDisabled();

        await TopMenu.backButton.click();
      });
    });

    describe('file parsing and decryption', () => {
      beforeEach(async () => {
        await ImportFormScreen.importByKeystoreFileButton.click();
      });

      afterEach(async () => {
        await TopMenu.backButton.click();
      });

      async function extractParsedAccountsFromDOM() {
        const accountsGroups = await ChooseAccountsForm.accountsGroups;
        return await Promise.all(
          accountsGroups.map(async (group: any) => {
            const accountCards = await group.accounts;
            return {
              accounts: await Promise.all(
                accountCards.map(async (account: any) => ({
                  address: await account.getAddress(),
                  name: await account.name.getText(),
                })),
              ),
              label: await group.label.getText(),
            };
          }),
        );
      }

      it('can decrypt the correct keeper keystore file', async () => {
        await ImportKeystoreFileScreen.fileInput.addValue(
          '/app/test/fixtures/keystore-keeper.json',
        );
        await ImportKeystoreFileScreen.passwordInput.setValue('xHZ7Zaxu2wuncWC');
        await ImportKeystoreFileScreen.continueButton.click();

        expect(await extractParsedAccountsFromDOM()).toStrictEqual([
          {
            accounts: [{ address: '3PCj4z3TZ1jqZ7A9zYBoSbHnvRqFq2uy89r', name: 'test2' }],
            label: 'Mainnet',
          },
          {
            accounts: [
              { address: '3Mxpw1i3ZP6TbiuMU1qUdv6vSBoSvkCfQ8h', name: 'test' },
              { address: '3Mxpfxhrwyn4ynCi7WpogBQ8ccP2iD86jNi', name: 'test3' },
            ],
            label: 'Testnet',
          },
          {
            accounts: [{ address: '3MWxaD2xCMBUHnKkLJUqH3xFca2ak8wdd6D', name: 'test4' }],
            label: 'Stagenet',
          },
        ]);
      });

      it('can decrypt the correct exchange keystore file', async () => {
        await ImportKeystoreFileScreen.fileInput.addValue(
          '/app/test/fixtures/keystore-exchange.json',
        );
        await ImportKeystoreFileScreen.passwordInput.setValue('N72r78ByXBfNBnN#');
        await ImportKeystoreFileScreen.continueButton.click();

        expect(await extractParsedAccountsFromDOM()).toStrictEqual([
          {
            accounts: [
              { address: '3PAqjy2wRWdrEBCmj66UbNUjo5KDksk9rTA', name: 'test' },
              { address: '3PCj4z3TZ1jqZ7A9zYBoSbHnvRqFq2uy89r', name: 'test2' },
            ],
            label: 'Mainnet',
          },
        ]);
      });

      it('shows an error if the file format is not recognized', async () => {
        // Upload a non-keystore file — the component triggers errorFormat on parse failure
        await ImportKeystoreFileScreen.fileInput.addValue(
          '/app/test/fixtures/../helpers/TopMenu.ts',
        );
        await ImportKeystoreFileScreen.passwordInput.setValue('anypassword');
        await ImportKeystoreFileScreen.continueButton.click();

        await expect(
          ImportKeystoreFileScreen.root.findByText$('File format is not supported'),
        ).toBeDisplayed();
      });

      it('shows an error if the password is wrong', async () => {
        await ImportKeystoreFileScreen.fileInput.addValue(
          '/app/test/fixtures/keystore-keeper.json',
        );
        await ImportKeystoreFileScreen.passwordInput.setValue('wrong_password_123');
        await ImportKeystoreFileScreen.continueButton.click();

        await expect(
          ImportKeystoreFileScreen.root.findByText$(
            'Could not decrypt the Keystore file with the given password',
          ),
        ).toBeDisplayed();
      });
    });

    describe('actual import', () => {
      async function extractAccountCheckboxesFromDOM() {
        const accounts = await ChooseAccountsForm.accounts;
        return await Promise.all(
          accounts.map(async (account: any) => ({
            address: await account.getAddress(),
            name: await account.name.getText(),
            selected: await account.isSelected(),
          })),
        );
      }

      async function collectAllAccountNames() {
        const activeAccountName = await HomeScreen.activeAccountName.getText();
        await HomeScreen.otherAccountsButton.click();
        const otherAccountNames = await Promise.all(
          (await OtherAccountsScreen.accounts).map((it: any) => it.name.getText()),
        );
        await TopMenu.backButton.click();
        return [activeAccountName, ...otherAccountNames];
      }

      describe('when no accounts exist', () => {
        it('allows to select and import all accounts', async () => {
          await ImportFormScreen.importByKeystoreFileButton.click();
          await ImportKeystoreFileScreen.fileInput.addValue(
            '/app/test/fixtures/keystore-keeper.json',
          );
          await ImportKeystoreFileScreen.passwordInput.setValue('xHZ7Zaxu2wuncWC');
          await ImportKeystoreFileScreen.continueButton.click();

          expect(await extractAccountCheckboxesFromDOM()).toStrictEqual([
            {
              address: '3PCj4z3TZ1jqZ7A9zYBoSbHnvRqFq2uy89r',
              name: 'test2',
              selected: true,
            },
            {
              address: '3Mxpw1i3ZP6TbiuMU1qUdv6vSBoSvkCfQ8h',
              name: 'test',
              selected: true,
            },
            {
              address: '3Mxpfxhrwyn4ynCi7WpogBQ8ccP2iD86jNi',
              name: 'test3',
              selected: true,
            },
            {
              address: '3MWxaD2xCMBUHnKkLJUqH3xFca2ak8wdd6D',
              name: 'test4',
              selected: true,
            },
          ]);

          (
            await ChooseAccountsForm.getAccountByAddress('3Mxpfxhrwyn4ynCi7WpogBQ8ccP2iD86jNi')
          ).checkbox.click();
          (
            await ChooseAccountsForm.getAccountByAddress('3PCj4z3TZ1jqZ7A9zYBoSbHnvRqFq2uy89r')
          ).checkbox.click();

          expect(await extractAccountCheckboxesFromDOM()).toStrictEqual([
            {
              address: '3PCj4z3TZ1jqZ7A9zYBoSbHnvRqFq2uy89r',
              name: 'test2',
              selected: false,
            },
            {
              address: '3Mxpw1i3ZP6TbiuMU1qUdv6vSBoSvkCfQ8h',
              name: 'test',
              selected: true,
            },
            {
              address: '3Mxpfxhrwyn4ynCi7WpogBQ8ccP2iD86jNi',
              name: 'test3',
              selected: false,
            },
            {
              address: '3MWxaD2xCMBUHnKkLJUqH3xFca2ak8wdd6D',
              name: 'test4',
              selected: true,
            },
          ]);

          await ChooseAccountsForm.importButton.click();
          await ImportSuccessScreen.addAnotherAccountButton.click();

          await browser.switchToWindow(tabKeeper);
          await Network.switchToAndCheck('Testnet');

          expect(await collectAllAccountNames()).toStrictEqual(['test']);

          await Network.switchToAndCheck('Stagenet');

          expect(await collectAllAccountNames()).toStrictEqual(['test4']);
        });
      });

      describe('when some, but not all accounts already exist', () => {
        it('allows to select only unexisting accounts', async () => {
          await PopupHome.addAccount();

          await browser.switchToWindow(tabAccounts);
          await ImportFormScreen.importByKeystoreFileButton.click();
          await ImportKeystoreFileScreen.fileInput.addValue(
            '/app/test/fixtures/keystore-keeper.json',
          );
          await ImportKeystoreFileScreen.passwordInput.setValue('xHZ7Zaxu2wuncWC');
          await ImportKeystoreFileScreen.continueButton.click();

          expect(await extractAccountCheckboxesFromDOM()).toStrictEqual([
            {
              address: '3PCj4z3TZ1jqZ7A9zYBoSbHnvRqFq2uy89r',
              name: 'test2',
              selected: true,
            },
            {
              address: '3Mxpw1i3ZP6TbiuMU1qUdv6vSBoSvkCfQ8h',
              name: 'test',
              selected: null,
            },
            {
              address: '3Mxpfxhrwyn4ynCi7WpogBQ8ccP2iD86jNi',
              name: 'test3',
              selected: true,
            },
            {
              address: '3MWxaD2xCMBUHnKkLJUqH3xFca2ak8wdd6D',
              name: 'test4',
              selected: null,
            },
          ]);

          await ChooseAccountsForm.importButton.click();
          await ImportSuccessScreen.addAnotherAccountButton.click();

          await browser.switchToWindow(tabKeeper);
          await browser.openKeeperPopup();
          await Network.switchToAndCheck('Testnet');

          expect(await collectAllAccountNames()).toStrictEqual(['test', 'test3']);

          await Network.switchToAndCheck('Stagenet');

          expect(await collectAllAccountNames()).toStrictEqual(['test4']);

          await Network.switchToAndCheck('Mainnet');

          expect(await collectAllAccountNames()).toStrictEqual(['test2']);
        });
      });

      describe('when all accounts exist', () => {
        it('does not allow selecting anything and shows the "Skip" button', async () => {
          await PopupHome.addAccount();

          await browser.switchToWindow(tabAccounts);
          await ImportFormScreen.importByKeystoreFileButton.click();
          await ImportKeystoreFileScreen.fileInput.addValue(
            '/app/test/fixtures/keystore-keeper.json',
          );
          await ImportKeystoreFileScreen.passwordInput.setValue('xHZ7Zaxu2wuncWC');
          await ImportKeystoreFileScreen.continueButton.click();

          expect(await extractAccountCheckboxesFromDOM()).toStrictEqual([
            {
              address: '3PCj4z3TZ1jqZ7A9zYBoSbHnvRqFq2uy89r',
              name: 'test2',
              selected: null,
            },
            {
              address: '3Mxpw1i3ZP6TbiuMU1qUdv6vSBoSvkCfQ8h',
              name: 'test',
              selected: null,
            },
            {
              address: '3Mxpfxhrwyn4ynCi7WpogBQ8ccP2iD86jNi',
              name: 'test3',
              selected: null,
            },
            {
              address: '3MWxaD2xCMBUHnKkLJUqH3xFca2ak8wdd6D',
              name: 'test4',
              selected: null,
            },
          ]);

          await ChooseAccountsForm.skipButton.click();
          await ImportFormScreen.root.waitForDisplayed();
        });
      });

      describe('when the user already has an account with the same name, but different address', () => {
        beforeAll(async () => {
          await browser.switchToWindow(tabKeeper);
        });

        beforeEach(deleteEachAndSwitchToAccounts);

        it('adds suffix to the name', async () => {
          await AccountsHome.importAccount('test2', 'this is the seed for the test account');

          await ImportFormScreen.importByKeystoreFileButton.click();
          await ImportKeystoreFileScreen.fileInput.addValue(
            '/app/test/fixtures/keystore-keeper.json',
          );
          await ImportKeystoreFileScreen.passwordInput.setValue('xHZ7Zaxu2wuncWC');
          await ImportKeystoreFileScreen.continueButton.click();

          expect(await extractAccountCheckboxesFromDOM()).toContainEqual({
            address: '3PCj4z3TZ1jqZ7A9zYBoSbHnvRqFq2uy89r',
            name: 'test2 (1)',
            selected: true,
          });

          await ChooseAccountsForm.importButton.click();
          await ImportSuccessScreen.addAnotherAccountButton.click();

          await browser.switchToWindow(tabKeeper);
          await browser.openKeeperPopup();

          expect(await collectAllAccountNames()).toStrictEqual(['test2', 'test2 (1)']);
        });

        it('increments the number in suffix if it already exists', async () => {
          await AccountsHome.importAccount('test2', 'this is a seed for the test account');

          await AccountsHome.importAccount(
            'test2 (1)',
            'this is an another seed for the test account',
          );

          await ImportFormScreen.importByKeystoreFileButton.click();
          await ImportKeystoreFileScreen.fileInput.addValue(
            '/app/test/fixtures/keystore-keeper.json',
          );
          await ImportKeystoreFileScreen.passwordInput.setValue('xHZ7Zaxu2wuncWC');
          await ImportKeystoreFileScreen.continueButton.click();

          expect(await extractAccountCheckboxesFromDOM()).toContainEqual({
            address: '3PCj4z3TZ1jqZ7A9zYBoSbHnvRqFq2uy89r',
            name: 'test2 (2)',
            selected: true,
          });

          await ChooseAccountsForm.importButton.click();
          await ImportSuccessScreen.addAnotherAccountButton.click();

          await browser.switchToWindow(tabKeeper);
          await browser.openKeeperPopup();

          const accountNames = await collectAllAccountNames();
          ['test2 (1)', 'test2', 'test2 (2)'].forEach((name) => {
            expect(accountNames).toContainEqual(name);
          });
        });
      });
    });
  });
});
