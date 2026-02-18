import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

jest.mock('expo-localization', () => ({
  getLocales: jest.fn(),
}));

const LOCALE_STORAGE_KEY = '@finn_locale';
const USER_SELECTED_LOCALE_KEY = '@finn_locale_user_selected';

type I18nModule = {
  initLocale: () => Promise<void>;
  getLocale: () => 'en' | 'pt' | 'es' | 'fr' | 'de' | 'ja' | 'ar';
  setLocale: (locale: string) => Promise<void>;
};

const mockLocale = (languageCode: string, languageTag: string): Localization.Locale =>
  ({ languageCode, languageTag } as unknown as Localization.Locale);

const loadI18nModule = (): I18nModule => {
  let module: I18nModule | null = null;

  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    module = require('../../src/presentation/i18n');
  });

  if (!module) {
    throw new Error('Failed to load i18n module');
  }

  return module;
};

describe('i18n initialization', () => {
  beforeEach(async () => {
    jest.restoreAllMocks();
    await AsyncStorage.clear();
  });

  it('uses explicitly selected locale when user selection flag is set', async () => {
    await AsyncStorage.setItem(USER_SELECTED_LOCALE_KEY, 'true');
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, 'de');
    const i18n = loadI18nModule();
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined as never);
    jest.spyOn(Localization, 'getLocales').mockReturnValue([
      mockLocale('es', 'es'),
    ]);

    await i18n.initLocale();

    expect(i18n.getLocale()).toBe('de');
    expect(setItemSpy).toHaveBeenCalledWith(USER_SELECTED_LOCALE_KEY, 'true');
  });

  it('prefers device locale when there is no explicit selection', async () => {
    await AsyncStorage.setItem(USER_SELECTED_LOCALE_KEY, 'false');
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, 'de');
    const i18n = loadI18nModule();
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined as never);
    jest.spyOn(Localization, 'getLocales').mockReturnValue([
      mockLocale('fr', 'fr'),
    ]);

    await i18n.initLocale();

    expect(i18n.getLocale()).toBe('fr');
    expect(setItemSpy).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, 'fr');
    expect(setItemSpy).toHaveBeenCalledWith(USER_SELECTED_LOCALE_KEY, 'false');
  });

  it('marks locale as user-selected when manually set', async () => {
    const i18n = loadI18nModule();
    const setItemSpy = jest.spyOn(AsyncStorage, 'setItem').mockResolvedValue(undefined as never);

    await i18n.setLocale('es');

    expect(setItemSpy).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, 'es');
    expect(setItemSpy).toHaveBeenCalledWith(USER_SELECTED_LOCALE_KEY, 'true');
    expect(i18n.getLocale()).toBe('es');
  });
});
