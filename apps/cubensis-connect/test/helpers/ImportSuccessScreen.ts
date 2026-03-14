export const ImportSuccessScreen = {
  get addAnotherAccountButton() {
    return this.root.findByText$('Add another account');
  },

  get finishButton() {
    return this.root.findByText$('Finish');
  },
  get root() {
    return browser.findByTestId$('importSuccessForm');
  },
};
