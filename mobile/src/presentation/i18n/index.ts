import type { TranslationValue } from './strings';
import { strings } from './strings';

export type TranslateParams = Record<string, string | number>;

const locale = 'en';

export const getLocale = () => locale;

const format = (value: string, params?: TranslateParams) => {
  if (!params) return value;
  return Object.entries(params).reduce(
    (acc, [key, param]) => acc.replaceAll(`{${key}}`, String(param)),
    value
  );
};

export const t = (key: string, params?: TranslateParams) => {
  const value: TranslationValue | undefined = strings[locale][key];
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'string') {
    return format(value, params);
  }
  return key;
};

export const tList = (key: string) => {
  const value: TranslationValue | undefined = strings[locale][key];
  return Array.isArray(value) ? value : [];
};
