export const AssetScriptTransactionScreen = {
  get asset() {
    return this.root.findByTestId$('setAssetScriptAsset');
  },
  get root() {
    return $("[class*='transaction@']");
  },

  get script() {
    return this.root.findByTestId$('contentScript');
  },
};
