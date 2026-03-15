export const CancelOrderTransactionScreen = {
  get orderId() {
    return this.root.findByTestId$('cancelOrderOrderId');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
