import * as Sentry from 'sentry-expo';
import type { NavigationContainerRef } from '@react-navigation/native';
import { env } from '../config/env';

let initialized = false;
const routingInstrumentation = new Sentry.Native.ReactNavigationInstrumentation();

export const initializeSentry = (): void => {
  if (initialized) return;

  Sentry.init({
    dsn: env.sentryDsn || undefined,
    enableInExpoDevelopment: true,
    debug: false,
    enableAutoPerformanceTracing: true,
    tracesSampleRate: 0.2,
    enableNativeFramesTracking: true,
    enabled: Boolean(env.sentryDsn),
    integrations: [
      new Sentry.Native.ReactNativeTracing({
        routingInstrumentation,
      }),
    ],
  });

  initialized = true;
};

export const registerNavigationInstrumentation = (
  ref: NavigationContainerRef<ReactNavigation.RootParamList | undefined> | null
): void => {
  if (!ref) return;
  routingInstrumentation.registerNavigationContainer(ref);
};

export { routingInstrumentation as sentryRoutingInstrumentation };
