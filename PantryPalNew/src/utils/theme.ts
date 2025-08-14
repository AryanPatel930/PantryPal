// src/utils/theme.ts
import { DefaultTheme } from '@react-navigation/native';

export const colors = {
  primary: '#C84630',
  dark: '#000100',
  light: '#FBFEF9',
  accent: '#696D7D',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#CCCCCC',
  danger: '#FF5252',
  warning: '#FFC107',
  success: '#4CAF50',
  background: '#FBFEF9',
  text: '#000100',
  lightText: '#696D7D',
  border: '#CCCCCC',
  error: '#FF5252',
  surface: '#FFFFFF'
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32
  },
  h3: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28
  },
  body: {
    fontSize: 16,
    lineHeight: 24
  },
  caption: {
    fontSize: 12,
    lineHeight: 16
  },
  xl: 24,
  md: 16,
  lg: 20,
  sm: 14,
  xs: 12
};

export const PantryPalTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.light,
    card: colors.white,
    text: colors.dark,
    border: colors.gray,
    notification: colors.accent
  }
};