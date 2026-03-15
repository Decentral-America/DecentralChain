export const EmptyHomeScreen = {
  get addButton() {
    return this.root.findByText$('Add account');
  },
  isDisplayed: async () => {
    try {
      return await browser.findByTestId$('importForm', {}, { timeout: 5000 }).isDisplayed();
    } catch {
      return false;
    }
  },

  get root() {
    return browser.findByTestId$('importForm');
  },
};
