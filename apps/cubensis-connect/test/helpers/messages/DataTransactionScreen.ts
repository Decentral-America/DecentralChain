const DataRow = (wrapped: WebdriverIO.Element) => ({
  get key() {
    return wrapped.findByTestId$('dataRowKey');
  },
  get type() {
    return wrapped.findByTestId$('dataRowType');
  },
  get value() {
    return wrapped.findByTestId$('dataRowValue');
  },
});

export const DataTransactionScreen = {
  get contentScript() {
    return this.root.findByTestId$('customDataBinary');
  },

  async getDataRows() {
    return this.root.findAllByTestId$('dataRow').map((it: any) => DataRow(it));
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
