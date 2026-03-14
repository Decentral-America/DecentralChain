export const IssueTransactionScreen = {
  get contentScript() {
    return this.root.findByTestId$('contentScript');
  },

  get issueAmount() {
    return this.root.findByTestId$('issueAmount');
  },

  get issueDecimals() {
    return this.root.findByTestId$('issueDecimals');
  },

  get issueDescription() {
    return this.root.findByTestId$('issueDescription');
  },

  get issueReissuable() {
    return this.root.findByTestId$('issueReissuable');
  },

  get issueType() {
    return this.root.findByTestId$('issueType');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
