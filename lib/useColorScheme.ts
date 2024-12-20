import { useColorScheme as useNativeColorScheme } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const COLOR_SCHEME_KEY = '@color-scheme';

type ColorScheme = 'light' | 'dark' | 'system';

const colors = {
  light: {
    primary: '#0369a1', // sky-700 (WCAG AAA compliant)
    primaryForeground: '#ffffff',
    background: '#ffffff',
    secondaryBackground: '#f8fafc', // slate-50
    card: '#ffffff',
    text: '#0f172a', // slate-900
    border: '#cbd5e1', // slate-300 (increased contrast)
    notification: '#dc2626', // red-600 (WCAG AA compliant)
    muted: '#475569', // slate-600 (increased contrast)
    foreground: '#0f172a', // slate-900
    mutedForeground: '#475569', // slate-600 (increased contrast)
    accent: '#f1f5f9', // slate-100
    input: '#f8fafc', // slate-50
    error: '#dc2626', // red-600
    success: '#16a34a', // green-600
    warning: '#d97706', // amber-600
  },
  dark: {
    primary: '#38bdf8', // sky-400 (WCAG AAA compliant)
    primaryForeground: '#000000', // black text on light primary
    background: '#0f172a', // slate-900
    secondaryBackground: '#1e293b', // slate-800
    card: '#1e293b', // slate-800
    text: '#f8fafc', // slate-50
    border: '#475569', // slate-600 (increased contrast)
    notification: '#ef4444', // red-500
    muted: '#cbd5e1', // slate-300 (increased contrast)
    foreground: '#f8fafc', // slate-50
    mutedForeground: '#cbd5e1', // slate-300 (increased contrast)
    accent: '#1e293b', // slate-800
    input: '#1e293b', // slate-800
    error: '#ef4444', // red-500
    success: '#22c55e', // green-500
    warning: '#f59e0b', // amber-500
  },
};

export function useColorScheme() {
  const nativeColorScheme = useNativeColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('system');

  useEffect(() => {
    AsyncStorage.getItem(COLOR_SCHEME_KEY).then((value) => {
      if (value) {
        setColorSchemeState(value as ColorScheme);
      }
    });
  }, []);

  const setColorScheme = useCallback(async (scheme: ColorScheme) => {
    await AsyncStorage.setItem(COLOR_SCHEME_KEY, scheme);
    setColorSchemeState(scheme);
  }, []);

  const isDarkColorScheme = useMemo(() => {
    if (colorScheme === 'system') {
      return nativeColorScheme === 'dark';
    }
    return colorScheme === 'dark';
  }, [colorScheme, nativeColorScheme]);

  const currentColors = useMemo(() =>
    isDarkColorScheme ? colors.dark : colors.light
    , [isDarkColorScheme]);

  return {
    colorScheme,
    isDarkColorScheme,
    setColorScheme,
    colors: currentColors,
  };
}