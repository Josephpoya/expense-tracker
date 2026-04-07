import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeCode = 'dark' | 'light' | 'system';

interface ThemeColors {
  bg: string;
  card: string;
  border: string;
  text: string;
  muted: string;
  purple: string;
  teal: string;
  red: string;
  green: string;
}

const DARK_COLORS: ThemeColors = {
  bg: '#0f0c29',
  card: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.10)',
  text: '#ffffff',
  muted: 'rgba(255,255,255,0.55)',
  purple: '#6C63FF',
  teal: '#3ECFCF',
  red: '#f87171',
  green: '#4ade80',
};

const LIGHT_COLORS: ThemeColors = {
  bg: '#f4f4fb',
  card: 'rgba(0,0,0,0.04)',
  border: 'rgba(0,0,0,0.10)',
  text: '#0f0c29',
  muted: 'rgba(0,0,0,0.45)',
  purple: '#6C63FF',
  teal: '#2aabab',
  red: '#ef4444',
  green: '#16a34a',
};

interface ThemeContextValue {
  themeCode: ThemeCode;
  setThemeCode: (code: ThemeCode) => void;
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeCode: 'dark',
  setThemeCode: () => {},
  colors: DARK_COLORS,
  isDark: true,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const [themeCode, setThemeCodeState] = useState<ThemeCode>('dark');

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem('app_theme').then((saved) => {
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        setThemeCodeState(saved);
      }
    });
  }, []);

  const setThemeCode = async (code: ThemeCode) => {
    setThemeCodeState(code);
    await AsyncStorage.setItem('app_theme', code);
  };

  // Resolve actual dark/light based on selection
  const resolvedDark =
    themeCode === 'system' ? systemScheme === 'dark' : themeCode === 'dark';

  const colors = resolvedDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ themeCode, setThemeCode, colors, isDark: resolvedDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
