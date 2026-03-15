import waitForExpect from 'wait-for-expect';

import { ContentScript } from './helpers/ContentScript';
import { EmptyHomeScreen } from './helpers/EmptyHomeScreen';
import { AccountsHome } from './helpers/flows/AccountsHome';
import { App } from './helpers/flows/App';
import { Settings } from './helpers/flows/Settings';
import { HomeScreen } from './helpers/HomeScreen';
import { MessagesScreen } from './helpers/MessagesScreen';
import { AuthMessageScreen } from './helpers/messages/AuthMessageScreen';
import { FinalTransactionScreen } from './helpers/messages/FinalTransactionScreen';
import { PermissionControlSettingsScreen } from './helpers/settings/PermissionControlSettingsScreen';
import { SettingsMenuScreen } from './helpers/settings/SettingsMenuScreen';
import { TopMenu } from './helpers/TopMenu';
import { Windows } from './helpers/Windows';
import { CUSTOMLIST, WHITELIST } from './utils/constants';

describe('Messages', () => {
  let tabOrigin: string;
  let messageWindow: string | null = null;

  const sendNotification = (...args: [done: () => void]) => {
    const done = args[args.length - 1];

    CubensisConnect.notification({ message: 'World!', title: 'Hello!' }).then(done).catch(done);
  };

  const sendNotificationWithoutWait = (...args: [done: () => void]) => {
    const [done] = args;

    CubensisConnect.notification({ message: 'World!', title: 'Hello!' });
    done();
  };

  beforeAll(async () => {
    await App.initVault();
    const tabKeeper = await browser.getWindowHandle();

    const { waitForNewWindows } = await Windows.captureNewWindows();
    await EmptyHomeScreen.addButton.click();
    const [tabAccounts] = await waitForNewWindows(1);

    await browser.switchToWindow(tabKeeper);
    await browser.closeWindow();

    await browser.switchToWindow(tabAccounts);
    await browser.refresh();

    // TODO: Update seed phrase when DCC test node genesis config is set up
    await AccountsHome.importAccount('rich', 'waves private node seed with waves tokens');

    tabOrigin = (await browser.createWindow('tab')).handle;

    await browser.switchToWindow(tabAccounts);
    await browser.closeWindow();
    await browser.switchToWindow(tabOrigin);
  });

  afterAll(async () => {
    const tabKeeper = await browser.getWindowHandle();
    await browser.openKeeperPopup();
    await Settings.clearCustomList();
    await App.closeBgTabs(tabKeeper);
    await App.resetVault();
  });

  for (const origin of WHITELIST) {
    it(`Allowed messages from ${origin}`, async () => {
      await browser.navigateTo(`https://${origin}`);

      const { waitForNewWindows } = await Windows.captureNewWindows();
      await ContentScript.waitForCubensisConnect();
      await browser.executeAsync(sendNotification);
      [messageWindow] = await waitForNewWindows(1);
      await browser.switchToWindow(messageWindow);
      await browser.refresh();

      await waitForExpect(async () => {
        expect(await MessagesScreen.messages).not.toHaveLength(0);
      });
      await MessagesScreen.closeButton.click();
      await Windows.waitForWindowToClose(messageWindow);
      messageWindow = null;
      await browser.switchToWindow(tabOrigin);
    });
  }

  it('When a message is received from a new resource, permission is requested to access', async () => {
    await browser.navigateTo(`https://${CUSTOMLIST[0]!}`);

    const { waitForNewWindows } = await Windows.captureNewWindows();
    await ContentScript.waitForCubensisConnect();
    await browser.executeAsync(sendNotificationWithoutWait);
    [messageWindow] = await waitForNewWindows(1);
    await browser.switchToWindow(messageWindow);
    await browser.refresh();

    await expect(AuthMessageScreen.root).toBeDisplayed();
  });

  it('When allowing access to messages - the message is instantly displayed', async () => {
    await AuthMessageScreen.permissionDetailsButton.click();
    await AuthMessageScreen.allowMessagesCheckbox.click();
    await AuthMessageScreen.authButton.click();

    expect(await MessagesScreen.messages).not.toHaveLength(0);

    await MessagesScreen.closeButton.click();
    await Windows.waitForWindowToClose(messageWindow!);
    messageWindow = null;
    await browser.switchToWindow(tabOrigin);
  });

  it('When allowing access to an application, but denying messages - messages are not displayed', async () => {
    await browser.navigateTo(`https://${CUSTOMLIST[1]!}`);

    const { waitForNewWindows } = await Windows.captureNewWindows();
    await ContentScript.waitForCubensisConnect();
    await browser.executeAsync(sendNotificationWithoutWait);
    [messageWindow] = await waitForNewWindows(1);
    await browser.switchToWindow(messageWindow);
    await browser.refresh();

    await AuthMessageScreen.permissionDetailsButton.click();
    await AuthMessageScreen.authButton.click();

    await expect(FinalTransactionScreen.transactionContent).toHaveText('Request has been signed!');

    await FinalTransactionScreen.closeButton.click();
    await Windows.waitForWindowToClose(messageWindow);
    messageWindow = null;
    await browser.switchToWindow(tabOrigin);
  });

  it('When allowing access from settings - messages are displayed', async () => {
    await browser.openKeeperPopup();

    await TopMenu.settingsButton.click();
    await SettingsMenuScreen.permissionsSectionLink.click();

    await (
      await PermissionControlSettingsScreen.getPermissionByOrigin(CUSTOMLIST[1]!)
    ).detailsIcon.click();
    await PermissionControlSettingsScreen.permissionDetailsModal.allowMessagesCheckbox.click();
    await PermissionControlSettingsScreen.permissionDetailsModal.saveButton.click();

    await browser.navigateTo(`https://${CUSTOMLIST[1]!}`);

    const { waitForNewWindows } = await Windows.captureNewWindows();
    await ContentScript.waitForCubensisConnect();
    await browser.executeAsync(sendNotification);
    [messageWindow] = await waitForNewWindows(1);
    await browser.switchToWindow(messageWindow);
    await browser.refresh();

    expect(await MessagesScreen.messages).not.toHaveLength(0);
    await MessagesScreen.closeButton.click();
    await Windows.waitForWindowToClose(messageWindow);
    messageWindow = null;
    await browser.switchToWindow(tabOrigin);
  });

  it('When receiving several messages from one resource - messages are displayed as a "batch"', async () => {
    await browser.navigateTo(`https://${WHITELIST[3]!}`);

    const { waitForNewWindows } = await Windows.captureNewWindows();
    for (let success = 0; success < 2; ) {
      await ContentScript.waitForCubensisConnect();
      const result = await browser.executeAsync<any, []>(sendNotification);

      if (result?.code === '18') {
        await browser.pause(5 * 1000);
      } else {
        success++;
      }
    }
    [messageWindow] = await waitForNewWindows(1);
    await browser.switchToWindow(messageWindow);
    await browser.refresh();

    expect(await MessagesScreen.messages).toHaveLength(2);
    // do not clear messages for next test
  });

  it('When receiving messages from several resources - messages are displayed in several blocks', async () => {
    await browser.switchToWindow(tabOrigin);
    await browser.navigateTo(`https://${WHITELIST[4]}`);

    await ContentScript.waitForCubensisConnect();
    await browser.executeAsync(sendNotification);
    expect(messageWindow).not.toBeNull();
    await browser.switchToWindow(messageWindow!);
    await browser.refresh();

    expect(await MessagesScreen.messagesCards).toHaveLength(2);
    // do not clear messages for next test
  });

  it('The "Clear all" button closes all messages', async () => {
    await MessagesScreen.clearAllButton.click();
    await expect(HomeScreen.root).toBeDisplayed();

    await browser.closeWindow();
    await browser.switchToWindow(tabOrigin);
  });

  // TODO looks like these units need to be checked in unittests
  it('You cannot send messages from one resource more often than once every 30 seconds');
  it('The message title cannot be longer than 20 characters');
  it('The message text cannot be longer than 250 characters');
  it('Title is a required field');
  it('Message is an optional field');
  it('Encrypting and decrypting messages');
});
