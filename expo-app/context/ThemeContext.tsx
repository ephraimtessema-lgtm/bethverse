import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import {
  darkColors,
  lightColors,
  FONT_FAMILIES,
  type ThemeColors,
  type ThemeMode,
  type FontStyle,
  type AppFonts,
} from '@/lib/theme';
import { storage } from '@/lib/storage';
import { getStrings, type Lang, type Strings } from '@/lib/i18n';

type ThemeContextValue = {
  colors: ThemeColors;
  isDark: boolean;
  theme: ThemeMode;
  fontStyle: FontStyle;
  fonts: AppFonts;
  lang: Lang;
  t: Strings;
  amharicUi: boolean;
  setTheme: (mode: ThemeMode) => Promise<void>;
  setFontStyle: (style: FontStyle) => Promise<void>;
  setAmharicUi: (v: boolean) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [fontStyle, setFontStyleState] = useState<FontStyle>('amharic');
  const [amharicUi, setAmharicUiState] = useState(true);

  useEffect(() => {
    (async () => {
      setThemeState((await storage.getTheme()) as ThemeMode);
      setFontStyleState((await storage.getFont()) as FontStyle);
      setAmharicUiState(await storage.getAmharicUi());
    })();
  }, []);

  const isDark = theme === 'system' ? systemScheme !== 'light' : theme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const fonts = FONT_FAMILIES[fontStyle] ?? FONT_FAMILIES.amharic;
  const lang: Lang = amharicUi ? 'am' : 'en';
  const t = getStrings(lang);

  const setTheme = useCallback(async (mode: ThemeMode) => {
    await storage.setTheme(mode);
    setThemeState(mode);
  }, []);

  const setFontStyle = useCallback(async (style: FontStyle) => {
    await storage.setFont(style);
    setFontStyleState(style);
  }, []);

  const setAmharicUi = useCallback(async (v: boolean) => {
    await storage.setAmharicUi(v);
    setAmharicUiState(v);
  }, []);

  const value = useMemo(
    () => ({
      colors,
      isDark,
      theme,
      fontStyle,
      fonts,
      lang,
      t,
      amharicUi,
      setTheme,
      setFontStyle,
      setAmharicUi,
    }),
    [colors, isDark, theme, fontStyle, fonts, lang, t, amharicUi, setTheme, setFontStyle, setAmharicUi],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useAppTheme outside ThemeProvider');
  return ctx;
}
