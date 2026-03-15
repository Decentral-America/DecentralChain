export const FinalTransactionScreen = {
  get closeButton() {
    return browser.findByText$('Close');
  },
  get root() {
    return $("[class*='transaction@']");
  },

  get transactionContent() {
    return this.root.$("[class*='transactionContent']");
  },
};
