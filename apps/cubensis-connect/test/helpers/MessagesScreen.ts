export const MessagesScreen = {
  get clearAllButton() {
    return this.root.findByText$('Clear All');
  },

  get closeButton() {
    return this.root.findByText$('Close');
  },

  get messages() {
    return this.root.$$("[class*='messageItemInner@']");
  },

  get messagesCards() {
    return this.root.$$("[class*='cardItem@']");
  },
  get root() {
    return $("[class*='messageList@'], [class*='root@messagesAndNotifications']");
  },
};
