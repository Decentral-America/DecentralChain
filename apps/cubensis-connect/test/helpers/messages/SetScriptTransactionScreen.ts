export const SetScriptTransactionScreen = {
  get contentScript() {
    return this.root.findByTestId$('contentScript');
  },
  get root() {
    return $("[class*='screen@']");
  },

  get scriptTitle() {
    return this.root.findByTestId$('setScriptTitle');
  },
};
