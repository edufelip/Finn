/**
 * Translation coverage tests
 * 
 * Ensures all languages have complete translation coverage
 */

import { strings, type Locale } from '../../src/presentation/i18n/strings';
import { t, getSupportedLocales } from '../../src/presentation/i18n';

describe('Translation Coverage', () => {
  const supportedLocales: Locale[] = ['en', 'pt', 'es', 'fr', 'de', 'ja', 'ar'];
  const englishKeys = Object.keys(strings.en);
  
  describe('Supported locales', () => {
    it('should include all 7 languages', () => {
      const locales = getSupportedLocales();
      expect(locales).toHaveLength(7);
      expect(locales).toEqual(expect.arrayContaining(supportedLocales));
    });
  });

  describe('Translation completeness', () => {
    const englishKeys = Object.keys(strings.en);
    const expectedKeyCount = englishKeys.length;

    supportedLocales.forEach((locale) => {
      describe(`${locale} translations`, () => {
        it(`should have all ${expectedKeyCount} translation keys`, () => {
          const localeKeys = Object.keys(strings[locale]);
          expect(localeKeys).toHaveLength(expectedKeyCount);
        });

        it('should have the same keys as English', () => {
          const localeKeys = Object.keys(strings[locale]);
          const missingKeys = englishKeys.filter((key) => !localeKeys.includes(key));
          const extraKeys = localeKeys.filter((key) => !englishKeys.includes(key));

          expect(missingKeys).toEqual([]);
          expect(extraKeys).toEqual([]);
        });

        it('should not have empty string values', () => {
          const emptyKeys: string[] = [];
          
          Object.entries(strings[locale]).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim() === '') {
              emptyKeys.push(key);
            } else if (Array.isArray(value) && value.length === 0) {
              emptyKeys.push(key);
            }
          });

          expect(emptyKeys).toEqual([]);
        });

        it('should have properly formatted language name', () => {
          const languageKey = `language.${locale}`;
          const languageName = strings[locale][languageKey];
          
          expect(languageName).toBeDefined();
          expect(typeof languageName).toBe('string');
          expect(languageName.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Translation consistency', () => {
    it('should have consistent interpolation placeholders across languages', () => {
      const inconsistencies: string[] = [];

      englishKeys.forEach((key) => {
        const englishValue = strings.en[key];
        if (typeof englishValue !== 'string') return;

        // Extract placeholders from English (e.g., {count}, {name})
        const placeholders = englishValue.match(/\{[a-zA-Z0-9_]+\}/g) || [];
        
        if (placeholders.length === 0) return;

        supportedLocales.forEach((locale) => {
          if (locale === 'en') return;
          
          const localeValue = strings[locale][key] as string | string[] | undefined;
          if (typeof localeValue !== 'string') return;

          const localePlaceholders: string[] = localeValue.match(/\{[a-zA-Z0-9_]+\}/g) || [];
          
          // Check if all placeholders are present
          placeholders.forEach((placeholder) => {
            if (!localePlaceholders.includes(placeholder)) {
              inconsistencies.push(`${locale}.${key} missing placeholder: ${placeholder}`);
            }
          });
        });
      });

      expect(inconsistencies).toEqual([]);
    });

    it('should preserve special characters (—) across translations', () => {
      const emptyDashKey = 'common.emptyDash';
      
      supportedLocales.forEach((locale) => {
        expect(strings[locale][emptyDashKey]).toBe('—');
      });
    });
  });

  describe('RTL language support', () => {
    it('should have Arabic translations in RTL script', () => {
      // Check a few sample keys to ensure they contain Arabic script
      const sampleKeys = ['common.cancel', 'auth.login', 'tabs.home'];
      
      sampleKeys.forEach((key) => {
        const arabicValue = strings.ar[key];
        expect(typeof arabicValue).toBe('string');
        
        // Arabic Unicode range: U+0600 to U+06FF
        const hasArabicScript = /[\u0600-\u06FF]/.test(arabicValue as string);
        expect(hasArabicScript).toBe(true);
      });
    });

    it('should have proper Arabic language name', () => {
      expect(strings.ar['language.ar']).toBe('العربية');
    });
  });

  describe('Japanese language support', () => {
    it('should have Japanese translations in Japanese script', () => {
      // Check a few sample keys to ensure they contain Japanese characters
      const sampleKeys = ['common.cancel', 'auth.login', 'tabs.home'];
      
      sampleKeys.forEach((key) => {
        const japaneseValue = strings.ja[key];
        expect(typeof japaneseValue).toBe('string');
        
        // Japanese Unicode ranges: Hiragana, Katakana, Kanji
        const hasJapaneseScript = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(japaneseValue as string);
        expect(hasJapaneseScript).toBe(true);
      });
    });

    it('should have proper Japanese language name', () => {
      expect(strings.ja['language.ja']).toBe('日本語');
    });
  });

  describe('Critical translation keys', () => {
    const criticalKeys = [
      'common.cancel',
      'common.error',
      'auth.login',
      'auth.logout',
      'tabs.home',
      'tabs.profile',
      'tabs.search',
      'settings.title',
      'language.en',
      'language.pt',
      'language.es',
      'language.fr',
      'language.de',
      'language.ja',
      'language.ar',
    ];

    supportedLocales.forEach((locale) => {
      it(`should have all critical keys in ${locale}`, () => {
        criticalKeys.forEach((key) => {
          expect(strings[locale][key]).toBeDefined();
          expect(strings[locale][key]).not.toBe('');
        });
      });
    });
  });

  describe('Translation function (t)', () => {
    it('should return correct translation for existing key', () => {
      const result = t('common.cancel');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return the key itself for missing translations', () => {
      const missingKey = 'this.key.does.not.exist';
      const result = t(missingKey);
      expect(result).toBe(missingKey);
    });

    it('should handle interpolation correctly', () => {
      // This assumes you have a key with interpolation
      const key = 'explore.trending.members';
      const result = t(key, { count: 42 });
      expect(result).toContain('42');
    });

    it('should handle array values correctly', () => {
      const result = t('home.tags');
      expect(typeof result).toBe('string');
      // Should convert array to comma-separated string
      expect(result).toContain(',');
    });
  });
});
