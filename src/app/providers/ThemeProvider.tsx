import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ThemeColors } from '../../presentation/theme/colors';
import { darkColors, lightColors } from '../../presentation/theme/colors';

export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  isDark: boolean;
  colors: ThemeColors;
  setPreference: (preference: ThemePreference) => Promise<void>;
  toggleTheme: () => Promise<void>;
};

const THEME_PREFERENCE_KEY = 'theme_preference';

const ThemeContext = createContext<ThemeContextValue>({
  preference: 'system',
  isDark: false,
  colors: lightColors,
  setPreference: async () => {},
  toggleTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() ?? Appearance.getColorScheme() ?? 'light';
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((stored) => {
        if (!mounted) return;
        if (stored === 'light' || stored === 'dark' || stored === 'system') {
          setPreferenceState(stored);
        }
      })
      .catch(() => {
        // Ignore storage failures.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedScheme = preference === 'system' ? systemScheme : preference;
  const isDark = resolvedScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const setPreference = useCallback(async (next: ThemePreference) => {
    setPreferenceState(next);
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, next);
    } catch {
      // Ignore storage failures.
    }
  }, []);

  const toggleTheme = useCallback(async () => {
    const next = resolvedScheme === 'dark' ? 'light' : 'dark';
    await setPreference(next);
  }, [resolvedScheme, setPreference]);

  const value = useMemo(
    () => ({
      preference,
      isDark,
      colors,
      setPreference,
      toggleTheme,
    }),
    [preference, isDark, colors, setPreference, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  return useTheme().colors;
}
