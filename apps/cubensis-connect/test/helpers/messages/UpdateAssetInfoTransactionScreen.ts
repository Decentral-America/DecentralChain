export const UpdateAssetInfoTransactionScreen = {
  get assetDescription() {
    return this.root.findByTestId$('updateAssetInfoAssetDescription');
  },

  get assetId() {
    return this.root.findByTestId$('updateAssetInfoAssetId');
  },

  get assetName() {
    return this.root.findByTestId$('updateAssetInfoAssetName');
  },

  get fee() {
    return this.root.findByTestId$('updateAssetInfoFee');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
