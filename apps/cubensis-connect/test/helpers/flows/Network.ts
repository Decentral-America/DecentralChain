import { NetworksMenu } from '../NetworksMenu';

export const Network = {
  checkNetwork: async (network: string) => {
    const networkMenuButton = NetworksMenu.networkMenuButton;
    await networkMenuButton.waitForDisplayed();
    await expect(networkMenuButton).toHaveText(network);
  },
  switchTo: async (network: string) => {
    const currentNetwork = await NetworksMenu.networkMenuButton.getText();
    if (currentNetwork === network) return;
    await NetworksMenu.networkMenuButton.click();
    await browser.pause(100);
    const networkLink = await NetworksMenu.networkByName(network);
    await networkLink.waitForDisplayed();
    await networkLink.click();
  },

  switchToAndCheck: async (network: string) => {
    await Network.switchTo(network);
    await Network.checkNetwork(network);
  },
};
