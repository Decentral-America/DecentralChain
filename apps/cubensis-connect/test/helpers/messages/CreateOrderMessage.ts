export const CreateOrderMessage = {
  get createOrderFee() {
    return this.root.findByTestId$('createOrderFee');
  },

  get orderAmount() {
    return this.root.findByTestId$('createOrderTitleAmount');
  },

  get orderMatcherPublicKey() {
    return this.root.findByTestId$('createOrderMatcherPublicKey');
  },

  get orderPrice() {
    return this.root.findByTestId$('createOrderPrice');
  },

  get orderPriceTitle() {
    return this.root.findByTestId$('createOrderTitlePrice');
  },

  get orderTitle() {
    return this.root.findByTestId$('createOrderTitle');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
