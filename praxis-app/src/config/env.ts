import Constants from 'expo-constants';

type ExpoExtra = {
  env?: string;
  apiBaseUrl?: string;
  sentryDsn?: string;
  analyticsKey?: string;
};

const extra = (Constants.expoConfig?.extra || {}) as ExpoExtra;

export const env = {
  appEnv: extra.env ?? 'development',
  apiBaseUrl: extra.apiBaseUrl ?? '',
  sentryDsn: extra.sentryDsn ?? '',
  analyticsKey: extra.analyticsKey ?? '',
};
