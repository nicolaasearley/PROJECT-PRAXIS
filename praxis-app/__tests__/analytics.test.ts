import { trackEvent, trackScreen, setAnalyticsClient } from '../src/core/analytics';

describe('analytics client', () => {
  beforeAll(() => {
    const events: string[] = [];
    setAnalyticsClient({
      trackEvent: (name: string) => events.push(name),
      trackScreen: (name: string) => events.push(name),
    });
  });

  it('tracks events without throwing', () => {
    expect(() => trackEvent('test_event')).not.toThrow();
  });

  it('tracks screens without throwing', () => {
    expect(() => trackScreen('test_screen')).not.toThrow();
  });
});
