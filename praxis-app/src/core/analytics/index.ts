import { env } from '../../config/env';

type AnalyticsPayload = Record<string, unknown>;

type AnalyticsClient = {
  trackEvent: (name: string, properties?: AnalyticsPayload) => void;
  trackScreen: (name: string, properties?: AnalyticsPayload) => void;
};

class ConsoleAnalyticsClient implements AnalyticsClient {
  trackEvent(name: string, properties?: AnalyticsPayload): void {
    // eslint-disable-next-line no-console
    console.log('[analytics:event]', name, properties || {});
  }

  trackScreen(name: string, properties?: AnalyticsPayload): void {
    // eslint-disable-next-line no-console
    console.log('[analytics:screen]', name, properties || {});
  }
}

let client: AnalyticsClient = new ConsoleAnalyticsClient();

export const setAnalyticsClient = (nextClient: AnalyticsClient): void => {
  client = nextClient;
};

const withContext = (properties?: AnalyticsPayload): AnalyticsPayload => ({
  appEnv: env.appEnv,
  ...properties,
});

export const trackEvent = (
  name: string,
  properties?: AnalyticsPayload
): void => {
  client.trackEvent(name, withContext(properties));
};

export const trackScreen = (
  name: string,
  properties?: AnalyticsPayload
): void => {
  client.trackScreen(name, withContext(properties));
};
