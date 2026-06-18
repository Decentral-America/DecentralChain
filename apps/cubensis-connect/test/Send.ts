import { AccountsHome } from './helpers/flows/AccountsHome';
import { App } from './helpers/flows/App';
import { Network } from './helpers/flows/Network';
import { HomeScreen } from './helpers/HomeScreen';
import { SendAssetScreen } from './helpers/SendAssetScreen';
import { TopMenu } from './helpers/TopMenu';
import { Windows } from './helpers/Windows';
import { DEFAULT_MINER_SEED } from './utils/constants';

describe('Send transaction', () => {
  let tabKeeper: string;
  let tabAccounts: string;

  // Testnet address with a valid format — used for positive address tests.
  const VALID_TESTNET_ADDRESS = '3MNXvMCn9FxPPjc4oe9oRGUSMDBXoQvUAdr';

  beforeAll(async () => {
    await App.initVault();
    tabKeeper = await browser.getWindowHandle();

    const { waitForNewWindows } = await Windows.captureNewWindows();
    await (await import('./helpers/EmptyHomeScreen')).EmptyHomeScreen.addButton.click();
    [tabAccounts] = await waitForNewWindows(1);
    await browser.switchToWindow(tabAccounts);
    await browser.refresh();

    // Import an account that is known on Testnet so DCC appears in the asset list.
    await AccountsHome.importAccount('rich', DEFAULT_MINER_SEED);

    await browser.switchToWindow(tabKeeper);
    await browser.openKeeperPopup();
    await Network.switchToAndCheck('Testnet');
  });

  afterAll(async () => {
    await browser.switchToWindow(tabKeeper);
    await App.resetVault();
  });

  // Navigate from the home screen asset card to the send form before each test,
  // and go back afterwards so each test starts from a clean form state.
  async function openSendForm() {
    const dccAsset = await HomeScreen.getAssetByName('DCC');
    await dccAsset.sendButton.click();
    await SendAssetScreen.root.waitForDisplayed();
  }

  async function closeSendForm() {
    await TopMenu.backButton.click();
    await HomeScreen.root.waitForDisplayed();
  }

  it('Send button opens send form with recipient and submit fields', async () => {
    await openSendForm();

    await expect(SendAssetScreen.recipientInput).toBeDisplayed();
    await expect(SendAssetScreen.submitButton).toBeDisplayed();

    await closeSendForm();
  });

  describe('Form validation', () => {
    beforeEach(openSendForm);
    afterEach(closeSendForm);

    it('Send form validates empty recipient — stays open without crashing', async () => {
      // Submit with everything empty to trigger validation.
      await SendAssetScreen.submitButton.click();

      // The form must remain displayed (no crash or unwanted navigation).
      await expect(SendAssetScreen.root).toBeExisting();
      await expect(SendAssetScreen.submitButton).toBeExisting();
    });

    it('Send form validates invalid address — stays open without crashing', async () => {
      await SendAssetScreen.recipientInput.setValue('not-an-address!!');
      await SendAssetScreen.submitButton.click();

      // Form stays open (no crash / navigation away).
      await expect(SendAssetScreen.root).toBeExisting();
      await expect(SendAssetScreen.submitButton).toBeExisting();
    });

    it('Send form validates zero amount — stays open without crashing', async () => {
      // Provide a valid recipient so the amount path is reached.
      await SendAssetScreen.recipientInput.setValue(VALID_TESTNET_ADDRESS);

      // Leave amount empty (default) and submit — amount error should fire.
      await SendAssetScreen.submitButton.click();

      // Form must stay open.
      await expect(SendAssetScreen.root).toBeExisting();
    });

    it('Send form accepts valid-format testnet address — no recipient error shown', async () => {
      await SendAssetScreen.recipientInput.setValue(VALID_TESTNET_ADDRESS);

      // Submit so the isTriedToSubmit flag is set, revealing any validation errors.
      await SendAssetScreen.submitButton.click();

      // Form stays open because the amount is still empty (amount error fires).
      await expect(SendAssetScreen.root).toBeExisting();

      // The send.tsx sets `error` prop on AddressSuggestInput only when
      // showRecipientError is true (isTriedToSubmit && recipientError != null).
      // A valid address means recipientError === null, so no error attribute on recipient.
      const recipientInputError = await SendAssetScreen.recipientInput.getAttribute('data-error');
      expect(recipientInputError).toBeFalsy();
    });

    it('Send form shows submit button enabled and labelled after valid recipient is entered', async () => {
      await SendAssetScreen.recipientInput.setValue(VALID_TESTNET_ADDRESS);

      // The submit button should be present and not disabled (disabled only while
      // isSubmitting, which is false until a valid full submission occurs).
      await expect(SendAssetScreen.submitButton).toBeDisplayed();
      await expect(SendAssetScreen.submitButton).not.toBeDisabled();

      const buttonText = await SendAssetScreen.submitButton.getText();
      expect(buttonText.trim().length).toBeGreaterThan(0);
    });
  });
});
