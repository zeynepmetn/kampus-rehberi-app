import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ActiveTheme = 'light' | 'dark';

// Renk paleti
export const ThemeColors = {
  light: {
    // Ana renkler
    primary: '#667eea',
    primaryLight: '#8b9cf0',
    secondary: '#4ECDC4',
    accent: '#FF6B6B',
    
    // Arka plan renkleri
    background: '#f8fafc',
    backgroundSecondary: '#ffffff',
    backgroundTertiary: '#f1f5f9',
    
    // Kart ve yüzey renkleri
    card: '#ffffff',
    cardBorder: 'rgba(0, 0, 0, 0.08)',
    surface: '#ffffff',
    
    // Metin renkleri
    text: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    textInverse: '#ffffff',
    
    // Tab bar
    tabBar: 'rgba(255, 255, 255, 0.95)',
    tabBarBorder: 'rgba(0, 0, 0, 0.08)',
    tabIconDefault: '#64748b',
    tabIconSelected: '#667eea',
    
    // Header gradient
    headerGradient: ['#667eea', '#764ba2'] as [string, string],
    
    // Input ve form
    inputBackground: 'rgba(0, 0, 0, 0.05)',
    inputBorder: 'rgba(0, 0, 0, 0.1)',
    inputText: '#1e293b',
    placeholder: '#94a3b8',
    
    // Durum renkleri
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Diğer
    divider: 'rgba(0, 0, 0, 0.08)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: '#000000',
  },
  dark: {
    // Ana renkler
    primary: '#667eea',
    primaryLight: '#8b9cf0',
    secondary: '#4ECDC4',
    accent: '#FF6B6B',
    
    // Arka plan renkleri
    background: '#0f172a',
    backgroundSecondary: '#1a1a2e',
    backgroundTertiary: '#16213e',
    
    // Kart ve yüzey renkleri
    card: 'rgba(255, 255, 255, 0.05)',
    cardBorder: 'rgba(255, 255, 255, 0.08)',
    surface: 'rgba(255, 255, 255, 0.05)',
    
    // Metin renkleri
    text: '#ffffff',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    textInverse: '#1e293b',
    
    // Tab bar
    tabBar: 'rgba(15, 23, 42, 0.95)',
    tabBarBorder: 'rgba(255, 255, 255, 0.08)',
    tabIconDefault: '#64748b',
    tabIconSelected: '#667eea',
    
    // Header gradient
    headerGradient: ['#1a1a2e', '#16213e'] as [string, string],
    
    // Input ve form
    inputBackground: 'rgba(255, 255, 255, 0.08)',
    inputBorder: 'rgba(255, 255, 255, 0.1)',
    inputText: '#ffffff',
    placeholder: '#64748b',
    
    // Durum renkleri
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Diğer
    divider: 'rgba(255, 255, 255, 0.05)',
    overlay: 'rgba(0, 0, 0, 0.7)',
    shadow: '#000000',
  },
};

export type ThemeColorsType = typeof ThemeColors.light;

interface ThemeContextType {
  themeMode: ThemeMode;
  activeTheme: ActiveTheme;
  colors: ThemeColorsType;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@kampus_theme_mode';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Aktif temayı hesapla
  const activeTheme: ActiveTheme = 
    themeMode === 'system' 
      ? (systemColorScheme || 'dark') 
      : themeMode;

  const colors = ThemeColors[activeTheme];
  const isDark = activeTheme === 'dark';

  // Tema tercihini yükle
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Tema modunu değiştir ve kaydet
  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }, []);

  // Tema değiştir (toggle)
  const toggleTheme = useCallback(() => {
    const newMode: ThemeMode = activeTheme === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
  }, [activeTheme, setThemeMode]);

  // Yüklenene kadar bekle
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        activeTheme,
        colors,
        setThemeMode,
        toggleTheme,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

