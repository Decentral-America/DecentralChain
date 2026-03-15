const Argument = (wrapped: WebdriverIO.Element) => ({
  get type() {
    return wrapped.findByTestId$('invokeArgumentType');
  },

  get value() {
    return wrapped.findByTestId$('invokeArgumentValue');
  },
});

export const InvokeScriptTransactionScreen = {
  get dApp() {
    return this.root.findByTestId$('invokeScriptDApp');
  },

  get function() {
    return this.root.findByTestId$('invokeScriptFunction');
  },

  async getArguments() {
    await this.root.waitForDisplayed();
    return await this.root.queryAllByTestId$('invokeArgument').map((it: any) => Argument(it));
  },

  async getPayments() {
    await this.root.waitForDisplayed();
    return await this.root.queryAllByTestId$('invokeScriptPaymentItem');
  },

  get paymentsTitle() {
    return this.root.findByTestId$('invokeScriptPaymentsTitle');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
