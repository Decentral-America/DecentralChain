export const ExportAndImportSettingsScreen = {
  get exportAccountsLink() {
    return this.root.findByText$('Export accounts');
  },
  get root() {
    return $("[class*='content@ExportAndImport']");
  },
};
