export const CustomNetworkModal = {
  get addressError() {
    return this.root.findByTestId$('nodeAddressError');
  },

  get addressInput() {
    return this.root.$('#node_address');
  },

  get matcherAddressInput() {
    return this.root.$('#matcher_address');
  },
  get root() {
    return $('#customNetwork');
  },

  get saveButton() {
    return this.root.$('#networkSettingsSave');
  },
};
