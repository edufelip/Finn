import { ExpoConfig, ConfigContext } from 'expo/config';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

export default ({ config }: ConfigContext): ExpoConfig => {
  const rawAppEnv = process.env.APP_ENV ?? process.env.EXPO_PUBLIC_APP_ENV ?? 'dev';
  const appEnv = rawAppEnv === 'prod' ? 'prod' : 'dev';
  const isDevEnv = appEnv === 'dev';
  const rawAppVariant = process.env.APP_VARIANT ?? process.env.EXPO_PUBLIC_APP_VARIANT ?? appEnv;
  const appVariant = rawAppVariant === 'prod' ? 'prod' : 'dev';
  const isDevVariant = appVariant === 'dev';
  const envFile = isDevEnv ? '.env.development' : '.env.production';
  const envPath = path.resolve(__dirname, envFile);

  if (!fs.existsSync(envPath)) {
    throw new Error(
      `[app.config] Missing ${envFile}. Ensure it exists at the repo root or set APP_ENV explicitly.`
    );
  }

  const env = dotenv.parse(fs.readFileSync(envPath));
  let supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  let supabaseAnonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
  const googleIosClientId = env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
  const googleAndroidClientId = env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
  const googleWebClientId = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

  const rawSupabaseEnv = process.env.APP_SUPABASE_ENV ?? appEnv;
  const supabaseEnv = rawSupabaseEnv === 'prod' ? 'prod' : 'dev';
  if (supabaseEnv === 'prod' && envFile !== '.env.production') {
    const prodEnvPath = path.resolve(__dirname, '.env.production');
    if (!fs.existsSync(prodEnvPath)) {
      throw new Error('[app.config] Missing .env.production required for APP_SUPABASE_ENV=prod.');
    }
    const prodEnv = dotenv.parse(fs.readFileSync(prodEnvPath));
    supabaseUrl = prodEnv.EXPO_PUBLIC_SUPABASE_URL ?? supabaseUrl;
    supabaseAnonKey = prodEnv.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? supabaseAnonKey;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `[app.config] Missing Supabase env vars in ${envFile}. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.`
    );
  }

  return {
    ...config,
    name: isDevVariant ? 'Finn Dev' : 'Finn',
    slug: isDevVariant ? 'finn-dev' : 'finn',
    version: '2.0.0',
    orientation: 'portrait',
    scheme: isDevVariant ? 'finn-dev' : 'finn',
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
      bundleIdentifier: isDevVariant ? 'com.edufelip.finn.dev' : 'com.edufelip.finn',
    },
    android: {
      package: isDevVariant ? 'com.edufelip.finn.dev' : 'com.edufelip.finn',
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
      appEnv,
      appVariant,
      supabaseUrl,
      supabaseAnonKey,
      googleIosClientId,
      googleAndroidClientId,
      googleWebClientId,
    },
  };
};
