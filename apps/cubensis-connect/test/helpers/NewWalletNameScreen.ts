export const NewWalletNameScreen = {
  get continueButton() {
    return this.root.findByText$('Continue');
  },

  get error() {
    return this.root.findByTestId$('newAccountNameError');
  },

  get nameInput() {
    return this.root.findByTestId$('newAccountNameInput');
  },
  get root() {
    return browser.findByTestId$('newWalletNameForm');
  },
};
