export const ReissueTransactionScreen = {
  get reissuableType() {
    return this.root.findByTestId$('reissueReissuable');
  },

  get reissueAmount() {
    return this.root.findByTestId$('reissueAmount');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
