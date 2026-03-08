import ga from 'react-ga4';

export class GoogleAnalyticsService {
  constructor(trackingId) {
    this.trackingId = trackingId;
  }

  initialize() {
    if (!this.trackingId) return;
    ga.initialize(this.trackingId, {
      titleCase: false,
      // debug: true
    });
  }

  sendEvent(event) {
    if (!this.trackingId) return;

    ga.event({
      category: event.categoryName,
      action: event.eventName,
      nonInteraction: true,
    });
  }
}
