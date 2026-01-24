import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { I18nManager, Alert } from 'react-native';
import { initLocale, setLocale as setI18nLocale, getLocale, getSupportedLocales } from '../../presentation/i18n';
import type { Locale } from '../../presentation/i18n/strings';

// RTL languages
const RTL_LOCALES: Locale[] = ['ar'];

interface LocalizationContextValue {
  locale: Locale;
  isReady: boolean;
  isRTL: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  supportedLocales: Locale[];
}

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within LocalizationProvider');
  }
  return context;
}

interface LocalizationProviderProps {
  children: React.ReactNode;
}

export function LocalizationProvider({ children }: LocalizationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(getLocale());
  const [isReady, setIsReady] = useState(false);
  const [isRTL, setIsRTL] = useState(I18nManager.isRTL);

  useEffect(() => {
    async function initialize() {
      await initLocale();
      const initialLocale = getLocale();
      setLocaleState(initialLocale);
      
      // Set RTL if needed on initialization
      const shouldBeRTL = RTL_LOCALES.includes(initialLocale);
      if (I18nManager.isRTL !== shouldBeRTL) {
        I18nManager.forceRTL(shouldBeRTL);
        setIsRTL(shouldBeRTL);
      }
      
      setIsReady(true);
    }

    initialize();
  }, []);

  const handleSetLocale = useCallback(async (newLocale: Locale) => {
    const shouldBeRTL = RTL_LOCALES.includes(newLocale);
    const needsRTLChange = I18nManager.isRTL !== shouldBeRTL;
    
    // Update locale
    await setI18nLocale(newLocale);
    setLocaleState(newLocale);
    
    // Handle RTL change if needed
    if (needsRTLChange) {
      I18nManager.forceRTL(shouldBeRTL);
      setIsRTL(shouldBeRTL);
      
      // Inform user they need to restart the app for RTL to take effect
      Alert.alert(
        'Restart Required',
        'Please restart the app for the layout direction to change.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const value: LocalizationContextValue = {
    locale,
    isReady,
    isRTL,
    setLocale: handleSetLocale,
    supportedLocales: getSupportedLocales(),
  };

  if (!isReady) {
    // Return null to show splash screen while initializing
    return null;
  }

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}
