export const SettingsMenuScreen = {
  get clickProtectionButton() {
    return this.root.findByTestId$('clickProtectionBtn');
  },

  get clickProtectionIcon() {
    return this.root.findByTestId$('clickProtectionIcon');
  },

  get clickProtectionStatus() {
    return this.root.findByTestId$('clickProtectionStatus');
  },

  get deleteAccountsButton() {
    return this.root.findByText$('Delete accounts');
  },

  get exportAndImportSectionLink() {
    return this.root.findByText$('Export and import');
  },

  get generalSectionLink() {
    return this.root.findByText$('General');
  },

  get helpTooltip() {
    return $("[class*='helpTooltip@settings']");
  },

  get logoutButton() {
    return this.root.findByText$('Log out');
  },

  get networkSectionLink() {
    return this.root.findByText$('Network');
  },

  get permissionsSectionLink() {
    return this.root.findByText$('Permissions control');
  },
  get root() {
    return $("[class*='content@settings']");
  },

  get suspiciousAssetsProtectionButton() {
    return this.root.findByTestId$('showSuspiciousAssetsBtn');
  },

  get suspiciousAssetsProtectionIcon() {
    return this.root.findByTestId$('showSuspiciousAssetsIcon');
  },

  get suspiciousAssetsProtectionStatus() {
    return this.root.findByTestId$('showSuspiciousAssetsStatus');
  },
};
