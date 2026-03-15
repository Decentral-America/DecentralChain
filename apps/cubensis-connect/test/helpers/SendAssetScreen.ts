export const SendAssetScreen = {
  get amountInput() {
    return this.root.findByTestId$('amountInput');
  },

  get attachmentInput() {
    return this.root.findByTestId$('attachmentInput');
  },

  get recipientInput() {
    return this.root.findByTestId$('recipientInput');
  },
  get root() {
    return $("[class*='root@send-module']");
  },

  get submitButton() {
    return this.root.findByTestId$('submitButton');
  },
};
