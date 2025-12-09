import React, { useEffect } from 'react';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as Sentry from 'sentry-expo';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { initializeSentry, registerNavigationInstrumentation } from '../src/monitoring/sentry';
import { trackEvent } from '../src/core/analytics';

initializeSentry();

function RootLayout() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    registerNavigationInstrumentation(navigationRef);
  }, [navigationRef]);

  useEffect(() => {
    trackEvent('app_open');
  }, []);

  return (
    <ThemeProvider>
      <Stack ref={navigationRef}>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default Sentry.Native.wrap(RootLayout);
