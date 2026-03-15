export const LeaseTransactionScreen = {
  get leaseAmount() {
    return this.root.findByTestId$('leaseAmount');
  },

  get leaseRecipient() {
    return this.root.findByTestId$('leaseRecipient');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
