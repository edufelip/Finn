import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  const APP_ENV = process.env.APP_ENV || 'prod';
  const isDev = APP_ENV === 'dev';

  return {
    ...config,
    name: isDev ? 'Finn Dev' : 'Finn',
    slug: isDev ? 'finn-dev' : 'finn',
    version: '2.0.0',
    orientation: 'portrait',
    scheme: isDev ? 'finn-dev' : 'finn',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#44A2D6',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: isDev ? 'com.edufelip.finn.dev' : 'com.edufelip.finn',
    },
    android: {
      package: isDev ? 'com.edufelip.finn.dev' : 'com.edufelip.finn',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#44A2D6',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-secure-store',
      'expo-sqlite',
      'expo-notifications',
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow access to your photo library to select images.',
          cameraPermission: 'Allow access to your camera to take photos.',
        },
      ],
    ],
    extra: {
      appEnv: APP_ENV,
    },
  };
};
