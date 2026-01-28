import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};
const rawAppEnv = extra.appEnv ?? process.env.EXPO_PUBLIC_APP_ENV ?? 'dev';
const appEnv = rawAppEnv === 'prod' ? 'prod' : 'dev';
const rawAppVariant = extra.appVariant ?? process.env.EXPO_PUBLIC_APP_VARIANT ?? appEnv;
const appVariant = rawAppVariant === 'prod' ? 'prod' : 'dev';

const supabaseUrl = extra.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = extra.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const googleIosClientId = extra.googleIosClientId ?? process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '';
const googleAndroidClientId = extra.googleAndroidClientId ?? process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '';
const googleWebClientId = extra.googleWebClientId ?? process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

if (__DEV__) {
  console.log(`[Env] Selected Environment: ${appEnv.toUpperCase()}`);
  console.log(`[Env] Selected Variant: ${appVariant.toUpperCase()}`);
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Env] Missing Supabase env vars in config:', {
    appEnv,
    supabaseUrlPresent: Boolean(supabaseUrl),
    supabaseAnonKeyPresent: Boolean(supabaseAnonKey),
  });
  throw new Error(
    'Missing Supabase env vars. Ensure .env files are loaded and app.config.ts populates extra.* with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

const env = {
  supabaseUrl,
  supabaseAnonKey,
  googleIosClientId,
  googleAndroidClientId,
  googleWebClientId,
  appEnv,
  appVariant,
};

export default env;
