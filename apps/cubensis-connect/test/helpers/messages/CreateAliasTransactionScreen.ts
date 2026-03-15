export const CreateAliasTransactionScreen = {
  get aliasValue() {
    return this.root.findByTestId$('aliasValue');
  },
  get root() {
    return $("[class*='transaction@']");
  },
};
