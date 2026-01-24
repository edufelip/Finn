import { en } from './locales/en';
import { pt } from './locales/pt';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { ja } from './locales/ja';
import { ar } from './locales/ar';

export type Locale = 'en' | 'pt' | 'es' | 'fr' | 'de' | 'ja' | 'ar';

export type TranslationValue = string | readonly string[];

type TranslationStrings = Record<string, TranslationValue>;

export const strings: Record<Locale, TranslationStrings> = {
  en,
  pt,
  es,
  fr,
  de,
  ja,
  ar,
};
