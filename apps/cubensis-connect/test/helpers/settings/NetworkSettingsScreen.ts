export const NetworkSettingsScreen = {
  get matcherAddress() {
    return this.root.$('#node_address');
  },

  get nodeAddress() {
    return this.root.$('#node_address');
  },
  get root() {
    return $("[class*='networkTab@settings']");
  },

  get setDefaultButton() {
    return this.root.$('#setDefault');
  },
};
