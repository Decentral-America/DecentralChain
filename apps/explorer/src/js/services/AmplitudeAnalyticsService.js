import amplitude from 'amplitude-js';

export class AmplitudeAnalyticsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  initialize() {
    if (!this.apiKey) return;
    amplitude.getInstance().init(this.apiKey);
  }

  sendEvent(event) {
    if (!this.apiKey) return;
    let properties = {
      category: event.categoryName,
    };

    if (event.properties) {
      properties = Object.assign({}, event.properties, properties);
    }

    amplitude.getInstance().logEvent(event.eventName, properties);
  }
}
