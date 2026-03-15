const TransferItem = (wrapped: WebdriverIO.Element) => ({
  get amount() {
    return wrapped.findByTestId$('massTransferItemAmount');
  },
  get recipient() {
    return wrapped.findByTestId$('massTransferItemRecipient');
  },
});

export const MassTransferTransactionScreen = {
  async getTransferItems() {
    return (await this.root.findAllByTestId$('massTransferItem')).map((it: any) =>
      TransferItem(it),
    );
  },

  get massTransferAmount() {
    return this.root.findByTestId$('massTransferAmount');
  },

  get massTransferAttachment() {
    return this.root.findByTestId$('massTransferAttachment');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
