const InvokeArgument = (wrapped: WebdriverIO.Element) => ({
  get type() {
    return wrapped.findByTestId$('invokeArgumentType');
  },

  get value() {
    return wrapped.findByTestId$('invokeArgumentValue');
  },
});

const PackageItem = (wrapped: WebdriverIO.Element) => ({
  get amount() {
    return wrapped.findByTestId$('issueAmount');
  },

  get attachmentContent() {
    return wrapped.findByTestId$('attachmentContent');
  },

  get burnAmount() {
    return wrapped.findByTestId$('burnAmount');
  },

  get cancelLeaseAmount() {
    return wrapped.findByTestId$('cancelLeaseAmount');
  },

  get cancelLeaseRecipient() {
    return wrapped.findByTestId$('cancelLeaseRecipient');
  },

  get contentScript() {
    return wrapped.findByTestId$('contentScript');
  },

  get decimals() {
    return wrapped.findByTestId$('issueDecimals');
  },

  get description() {
    return wrapped.findByTestId$('issueDescription');
  },

  get fee() {
    return wrapped.findByTestId$('txFee');
  },

  async getInvokeArguments() {
    return await wrapped.findAllByTestId$('invokeArgument').map((it: any) => InvokeArgument(it));
  },

  get invokeScriptDApp() {
    return wrapped.findByTestId$('invokeScriptDApp');
  },

  get invokeScriptFunction() {
    return wrapped.findByTestId$('invokeScriptFunction');
  },

  get invokeScriptPaymentItems() {
    return wrapped.findAllByTestId$('invokeScriptPaymentItem');
  },

  get invokeScriptPaymentsTitle() {
    return wrapped.findByTestId$('invokeScriptPaymentsTitle');
  },

  get leaseAmount() {
    return wrapped.findByTestId$('leaseAmount');
  },

  get leaseRecipient() {
    return wrapped.findByTestId$('leaseRecipient');
  },

  get recipient() {
    return wrapped.findByTestId$('recipient');
  },

  get reissuable() {
    return wrapped.findByTestId$('issueReissuable');
  },

  get reissueAmount() {
    return wrapped.findByTestId$('reissueAmount');
  },

  get transferAmount() {
    return wrapped.findByTestId$('transferAmount');
  },
  get type() {
    return wrapped.findByTestId$('issueType');
  },
});

export const PackageTransactionScreen = {
  async getPackageItems() {
    return await this.root.findAllByTestId$('packageItem').map((it: any) => PackageItem(it));
  },

  get packageAmounts() {
    return this.root.findAllByTestId$('packageAmountItem');
  },

  get packageCountTitle() {
    return this.root.findByTestId$('packageCountTitle');
  },

  get packageFees() {
    return this.root.findAllByTestId$('packageFeeItem');
  },
  get root() {
    return $("[class*='transaction@']");
  },

  get showTransactionsButton() {
    return this.root.findByTestId$('packageDetailsToggle');
  },
};
