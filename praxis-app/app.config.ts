import 'dotenv/config';
import { ExpoConfig, ConfigContext } from 'expo/config';

const APP_NAME = 'Project Praxis';
const DEFAULT_PROJECT_ID = '00000000-0000-0000-0000-000000000000';

const getProjectId = (): string =>
  process.env.EXPO_PUBLIC_EAS_PROJECT_ID || DEFAULT_PROJECT_ID;

export default ({ config }: ConfigContext): ExpoConfig => {
  const version = process.env.APP_VERSION || '1.0.0';
  const iosBuildNumber = process.env.IOS_BUILD_NUMBER || '1';
  const androidVersionCode = Number(process.env.ANDROID_VERSION_CODE || '1');

  return {
    ...config,
    name: APP_NAME,
    slug: 'praxis-app',
    scheme: 'praxis',
    version,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.praxisapp',
      buildNumber: iosBuildNumber,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.anonymous.praxisapp',
      versionCode: androidVersionCode,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    updates: {
      url: `https://u.expo.dev/${getProjectId()}`,
      enabled: true,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    plugins: [
      'expo-router',
      'expo-updates',
      [
        'sentry-expo',
        {
          organization: 'praxis',
          project: 'praxis-app',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      eas: {
        projectId: getProjectId(),
      },
      env: process.env.EXPO_APP_ENV || 'development',
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      analyticsKey: process.env.EXPO_PUBLIC_ANALYTICS_KEY || '',
    },
  };
};
