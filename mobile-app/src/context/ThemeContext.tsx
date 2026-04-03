import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { getColorsForTheme, type ColorPalette, type ThemeMode } from '../theme';

const THEME_KEY = '@patient_app_theme';
type ThemePreference = ThemeMode | 'system';

interface ThemeContextValue {
  themePreference: ThemePreference;
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (mode: ThemeMode) => Promise<void>;
  setThemePreference: (mode: ThemePreference) => Promise<void>;
  colors: ColorPalette;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light' || stored === 'system') {
        setThemePreferenceState(stored);
      }
    });
  }, []);

  const setThemePreference = useCallback(async (mode: ThemePreference) => {
    setThemePreferenceState(mode);
    await AsyncStorage.setItem(THEME_KEY, mode);
  }, []);
  const setTheme = useCallback(
    async (mode: ThemeMode) => {
      await setThemePreference(mode);
    },
    [setThemePreference]
  );
  const resolvedTheme: ThemeMode =
    themePreference === 'system'
      ? systemScheme === 'light'
        ? 'light'
        : 'dark'
      : themePreference;

  const value: ThemeContextValue = {
    themePreference,
    theme: resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setTheme,
    setThemePreference,
    colors: getColorsForTheme(resolvedTheme),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    const fallback = getColorsForTheme('dark');
    return {
      themePreference: 'dark',
      theme: 'dark',
      isDark: true,
      setTheme: async () => {},
      setThemePreference: async () => {},
      colors: fallback,
    };
  }
  return ctx;
}
