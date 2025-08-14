import React, { createContext, useState, useContext, ReactNode } from 'react';
import { MD3LightTheme as PaperDefaultTheme, MD3DarkTheme as PaperDarkTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PantryPalTheme } from '../utils/theme';

const combinedDefaultTheme = {
  ...PaperDefaultTheme,
  ...NavigationDefaultTheme,
  colors: {
    ...PaperDefaultTheme.colors,
    ...NavigationDefaultTheme.colors,
    primary: PantryPalTheme.colors.primary,
    background: PantryPalTheme.colors.background,
    card: PantryPalTheme.colors.card,
    text: PantryPalTheme.colors.text,
    border: PantryPalTheme.colors.border,
  },
};

const combinedDarkTheme = {
  ...PaperDarkTheme,
  ...NavigationDarkTheme,
  colors: {
    ...PaperDarkTheme.colors,
    ...NavigationDarkTheme.colors,
    primary: '#BB86FC',
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    border: '#2A2A2A',
  },
};

interface ThemeContextType {
  isDark: boolean;
  theme: any;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [isDark, setIsDark] = useState(false);

  React.useEffect(() => {
    const getStoredTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('darkMode');
        if (storedTheme !== null) {
          setIsDark(storedTheme === 'true');
        }
      } catch (e) {
        console.error('Failed to load theme preference:', e);
      }
    };
    getStoredTheme();
  }, []);

  const toggleTheme = async () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    try {
      await AsyncStorage.setItem('darkMode', String(newIsDark));
    } catch (e) {
      console.error('Failed to save theme preference:', e);
    }
  };

  const theme = isDark ? combinedDarkTheme : combinedDefaultTheme;

  return (
    <ThemeContext.Provider value={{ isDark, theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};