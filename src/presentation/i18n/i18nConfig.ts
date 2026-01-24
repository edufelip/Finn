/**
 * i18next configuration with pluralization support
 * 
 * This provides advanced i18n features including:
 * - Automatic pluralization rules for all languages
 * - Interpolation with proper escaping
 * - Nested translations
 * - Language detection
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { strings, type Locale } from './strings';

// Convert our strings format to i18next resources format
const resources: Record<Locale, { translation: Record<string, string> }> = {
  en: { translation: {} },
  pt: { translation: {} },
  es: { translation: {} },
  fr: { translation: {} },
  de: { translation: {} },
  ja: { translation: {} },
  ar: { translation: {} },
};

// Transform strings to i18next format
Object.keys(strings).forEach((lang) => {
  const locale = lang as Locale;
  const translations = strings[locale];
  
  Object.keys(translations).forEach((key) => {
    const value = translations[key];
    // Convert arrays to strings (e.g., tags)
    resources[locale].translation[key] = Array.isArray(value) ? value.join(', ') : value;
  });
});

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getLocales()[0]?.languageCode || 'en',
    fallbackLng: 'en',
    
    // Pluralization
    pluralSeparator: '_',
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    
    // React options
    react: {
      useSuspense: false,
    },
    
    // Debugging (disable in production)
    debug: __DEV__,
  });

export default i18n;
