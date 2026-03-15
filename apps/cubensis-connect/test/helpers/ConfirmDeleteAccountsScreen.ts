export const ConfirmDeleteAccountsScreen = {
  get cancelButton() {
    return this.root.findByTestId$('resetCancel');
  },

  get confirmPhraseError() {
    return this.root.findByTestId$('confirmPhraseError');
  },

  get confirmPhraseInput() {
    return this.root.findByTestId$('confirmPhrase');
  },

  get deleteAllButton() {
    return this.root.findByTestId$('resetConfirm');
  },
  get root() {
    return browser.findByTestId$('deleteAllAccounts');
  },
};
