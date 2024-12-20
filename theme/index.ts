import { Theme, DarkTheme, DefaultTheme } from '@react-navigation/native';

const colors = {
  light: {
    primary: '#0891b2', // cyan-600
    background: '#ffffff',
    card: '#f4f4f5', // zinc-100
    text: '#18181b', // zinc-900
    border: '#e4e4e7', // zinc-200
    notification: '#ef4444', // red-500
    muted: '#71717a', // zinc-500
  },
  dark: {
    primary: '#06b6d4', // cyan-500
    background: '#18181b', // zinc-900
    card: '#27272a', // zinc-800
    text: '#fafafa', // zinc-50
    border: '#3f3f46', // zinc-700
    notification: '#ef4444', // red-500
    muted: '#a1a1aa', // zinc-400
  },
};

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    dark: false,
    colors: {
      primary: colors.light.primary,
      background: colors.light.background,
      card: colors.light.card,
      text: colors.light.text,
      border: colors.light.border,
      notification: colors.light.notification,
    },
    fonts: DefaultTheme.fonts,
  },
  dark: {
    dark: true,
    colors: {
      primary: colors.dark.primary,
      background: colors.dark.background,
      card: colors.dark.card,
      text: colors.dark.text,
      border: colors.dark.border,
      notification: colors.dark.notification,
    },
    fonts: DarkTheme.fonts,
  },
};
