import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TranslationValue, Locale } from './strings';
import { strings } from './strings';

export type TranslateParams = Record<string, string | number>;

const SUPPORTED_LOCALES: Locale[] = ['en', 'pt', 'es', 'fr', 'de', 'ja', 'ar'];
const DEFAULT_LOCALE: Locale = 'en';
const LOCALE_STORAGE_KEY = '@finn_locale';

let currentLocale: Locale = DEFAULT_LOCALE;
let isInitialized = false;

/**
 * Initialize locale from device settings or stored preference
 */
export const initLocale = async (): Promise<void> => {
  try {
    // Check for stored preference first
    const storedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale as Locale)) {
      currentLocale = storedLocale as Locale;
      isInitialized = true;
      return;
    }

    // Fall back to device locale
    const deviceLocales = Localization.getLocales();
    if (deviceLocales && deviceLocales.length > 0) {
      const deviceLanguageCode = deviceLocales[0].languageCode;
      if (deviceLanguageCode && SUPPORTED_LOCALES.includes(deviceLanguageCode as Locale)) {
        currentLocale = deviceLanguageCode as Locale;
        await AsyncStorage.setItem(LOCALE_STORAGE_KEY, currentLocale);
      }
    }
    
    isInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize locale:', error);
    currentLocale = DEFAULT_LOCALE;
    isInitialized = true;
  }
};

/**
 * Set the current locale and persist it
 */
export const setLocale = async (locale: Locale): Promise<void> => {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`Unsupported locale: ${locale}`);
    return;
  }
  
  currentLocale = locale;
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (error) {
    console.warn('Failed to persist locale:', error);
  }
};

/**
 * Get the current locale
 */
export const getLocale = (): Locale => currentLocale;

/**
 * Get list of supported locales
 */
export const getSupportedLocales = (): Locale[] => [...SUPPORTED_LOCALES];

/**
 * Check if locale is initialized
 */
export const isLocaleInitialized = (): boolean => isInitialized;

const format = (value: string, params?: TranslateParams) => {
  if (!params) return value;
  return Object.entries(params).reduce(
    (acc, [key, param]) => acc.replaceAll(`{${key}}`, String(param)),
    value
  );
};

export const t = (key: string, params?: TranslateParams): string => {
  // Get value from current locale
  let value: TranslationValue | undefined = strings[currentLocale]?.[key];
  
  // Fall back to English if not found
  if (value === undefined) {
    value = strings[DEFAULT_LOCALE]?.[key];
  }
  
  // Return key if still not found (helps identify missing translations)
  if (value === undefined) {
    if (__DEV__) {
      console.warn(`Translation missing for key: ${key}`);
    }
    return key;
  }
  
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  
  if (typeof value === 'string') {
    return format(value, params);
  }
  
  return key;
};

export const tList = (key: string): string[] => {
  // Get value from current locale
  let value: TranslationValue | undefined = strings[currentLocale]?.[key];
  
  // Fall back to English if not found
  if (value === undefined) {
    value = strings[DEFAULT_LOCALE]?.[key];
  }
  
  return Array.isArray(value) ? value : [];
};

