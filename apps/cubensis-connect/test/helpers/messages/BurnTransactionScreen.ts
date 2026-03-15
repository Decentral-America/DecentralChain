export const BurnTransactionScreen = {
  get burnAmount() {
    return this.root.findByTestId$('burnAmount');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
