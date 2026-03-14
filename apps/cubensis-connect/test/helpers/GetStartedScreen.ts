export const GetStartedScreen = {
  get getStartedButton() {
    return this.root.findByText$('Get Started');
  },
  get root() {
    return $("[class*='content@Welcome-module']");
  },
};
