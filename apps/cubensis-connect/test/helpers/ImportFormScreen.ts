export const ImportFormScreen = {
  get createNewAccountButton() {
    return this.root.findByText$('Create a new account');
  },

  get importByKeystoreFileButton() {
    return this.root.findByText$('Keystore File');
  },

  get importViaSeedButton() {
    return this.root.findByText$('Seed Phrase or Private Key');
  },
  get root() {
    return browser.findByTestId$('importForm');
  },
};
