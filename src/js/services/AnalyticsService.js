import { AmplitudeAnalyticsService } from './AmplitudeAnalyticsService';
import { GoogleAnalyticsService } from './GoogleAnalyticsService';

export class AnalyticsService {
  constructor(googleTrackingId, amplitudeApiKey) {
    this.google = new GoogleAnalyticsService(googleTrackingId);
    this.amplitude = new AmplitudeAnalyticsService(amplitudeApiKey);
  }

  initialize() {
    this.google.initialize();
    this.amplitude.initialize();
  }

  sendEvent(event) {
    this.google.sendEvent(event);
    this.amplitude.sendEvent(event);
  }
}
