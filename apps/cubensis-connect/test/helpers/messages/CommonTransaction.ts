export const CommonTransaction = {
  get accountName() {
    return this.root.$("[class*='name@wallet']");
  },

  get approveButton() {
    return this.root.$('#approve');
  },

  get originAddress() {
    return this.root.$("[class*='originAddress@transactions']");
  },

  get originNetwork() {
    return this.root.findByTestId$('originNetwork');
  },

  get rejectButton() {
    return this.root.$('#reject');
  },
  get root() {
    return $("[class*='transaction@'], [class*='screen@']");
  },

  get transactionFee() {
    return this.root.findByTestId$('txFee');
  },
};
