export const LeaseCancelTransactionScreen = {
  get cancelLeaseAmount() {
    return this.root.findByTestId$('cancelLeaseAmount');
  },

  get cancelLeaseRecipient() {
    return this.root.findByTestId$('cancelLeaseRecipient');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
