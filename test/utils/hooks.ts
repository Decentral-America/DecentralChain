import {
  configure,
  setupBrowser,
  type WebdriverIOQueries,
  type WebdriverIOQueriesChainable,
} from '@testing-library/webdriverio';
import { expect } from 'expect-webdriverio';
import { afterAll, beforeAll } from 'vitest';
import { remote } from 'webdriverio';

/** Node URL as seen from inside the Selenium Docker container */
export const BROWSER_NODE_URL = 'http://waves-private-node:6869';

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any;
  }

  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace WebdriverIO {
    interface Browser
      extends WebdriverIOQueries,
        WebdriverIOQueriesChainable<Browser> {
      openKeeperPopup: () => Promise<void>;
      openKeeperExtensionPage: () => Promise<void>;
    }

    interface Element
      extends WebdriverIOQueries,
        WebdriverIOQueriesChainable<Element> {}
  }
}

declare module 'webdriverio' {
  interface ChainablePromiseElement<T extends WebdriverIO.Element | undefined>
    extends WebdriverIOQueriesChainable<T> {}
}

beforeAll(async () => {
  Object.defineProperty(global, 'expect', {
    configurable: true,
    value: expect,
  });
  Object.defineProperty(global, 'browser', {
    configurable: true,
    value: await remote({
      logLevel: 'warn',
      capabilities: {
        browserName: 'chrome',
        'goog:chromeOptions': {
          args: [
            '--load-extension=/app/dist/chrome',
            '--disable-web-security',
          ],
        },
        pageLoadStrategy: 'eager',
      },
      path: '/wd/hub',
      waitforTimeout: 15 * 1000,
    }),
  });

  configure({
    asyncUtilTimeout: 15 * 1000,
  });

  setupBrowser(browser);

  global.$ = browser.$.bind(browser);
  global.$$ = browser.$$.bind(browser);

  await browser.navigateTo('chrome://system');

  let keeperExtensionId: string | undefined;

  const extensionsValue = await $('#div-extensions-value').getText();
  for (const ext of extensionsValue.split('\n')) {
    const [id, name] = ext.split(' : ');

    if (name.toLowerCase() === 'cubensis connect') {
      keeperExtensionId = id;
      break;
    }
  }

  if (!keeperExtensionId) {
    throw new Error('Could not find Cubensis Connect extension id');
  }

  // default clearValue doesn't produce input event for some reason ¯\_(ツ)_/¯
  // https://github.com/webdriverio/webdriverio/issues/5869#issuecomment-964012560
  browser.overwriteCommand(
    'clearValue',
    async function (this: WebdriverIO.Element) {
      // https://w3c.github.io/webdriver/#keyboard-actions
      await this.elementSendKeys(this.elementId, '\uE009a'); // Ctrl+a
      await this.elementSendKeys(this.elementId, '\uE003'); // Backspace
    },
    true,
  );

  browser.addCommand(
    'openKeeperPopup',
    async function (this: WebdriverIO.Browser) {
      await this.navigateTo(
        `chrome-extension://${keeperExtensionId}/popup.html`,
      );
    },
  );

  browser.addCommand(
    'openKeeperExtensionPage',
    async function (this: WebdriverIO.Browser) {
      await this.navigateTo(`chrome://extensions/?id=${keeperExtensionId}`);
    },
  );
});

afterAll(async () => {
  if (typeof browser !== 'undefined') {
    browser.deleteSession();
  }
});
